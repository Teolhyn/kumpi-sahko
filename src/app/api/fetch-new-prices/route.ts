// src/app/api/fetch-new-prices/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

type PriceEntry = {
  timestamp: Date
  spotPrice: number
}

function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}${month}${day}${hour}${minute}`
}

function parseEntsoeXML(xml: string): PriceEntry[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  })

  const jsonObj = parser.parse(xml)
  const prices: PriceEntry[] = []

  try {
    const document = jsonObj.Publication_MarketDocument
    const timeSeries = document.TimeSeries

    if (!timeSeries) {
      console.warn('No TimeSeries found in XML')
      return prices
    }

    // Handle both single TimeSeries and array of TimeSeries
    const timeSeriesArray = Array.isArray(timeSeries) ? timeSeries : [timeSeries]

    for (const series of timeSeriesArray) {
      const period = series.Period
      const periodArray = Array.isArray(period) ? period : [period]

      for (const p of periodArray) {
        const startTime = new Date(p.timeInterval.start)
        const endTime = new Date(p.timeInterval.end)
        const points = Array.isArray(p.Point) ? p.Point : [p.Point]

        // Determine resolution: 15-minute (96 per day) or hourly (24 per day)
        const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        const pointsPerHour = points.length / totalHours

        // Snap to either 15-minute or 1-hour intervals
        const intervalMs = pointsPerHour >= 3 ? 15 * 60 * 1000 : 60 * 60 * 1000

        for (const point of points) {
          const position = parseInt(point.position) - 1 // ENTSO-E uses 1-based indexing
          const priceValue = parseFloat(point['price.amount'])

          // Calculate clean timestamp by adding interval-snapped duration
          const timestamp = new Date(startTime.getTime() + position * intervalMs)

          prices.push({
            timestamp,
            spotPrice: priceValue / 10 // Convert from EUR/MWh to cent/kWh
          })
        }
      }
    }
  } catch (error) {
    console.error('Error parsing ENTSO-E XML:', error)
    throw new Error('Failed to parse electricity price data')
  }

  return prices
}

export async function GET(req: Request) {
  console.log('=== fetch-new-prices endpoint called ===');
  try {
    // Verify request is from Vercel Cron or has valid authorization
    const auth = req.headers.get('authorization')
    const cronId = req.headers.get('x-vercel-cron-id')

    // Allow if it's a Vercel cron job (has x-vercel-cron-id header)
    // OR has valid Bearer token
    const isVercelCron = !!cronId
    const hasValidAuth = auth === `Bearer ${process.env.CRON_SECRET}`

    if (!isVercelCron && !hasValidAuth) {
      console.error('Unauthorized request - missing Vercel cron header or valid auth token')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log(`Request authorized via: ${isVercelCron ? 'Vercel Cron' : 'Bearer token'}`)

    const latestEntry = await prisma.electricityPrice.findFirst({
      orderBy: { timestamp: 'desc' },
    })

    // If no latest entry, start from beginning of current year; otherwise continue from latest + increment
    let start: Date
    if (latestEntry) {
      console.log(`Latest entry in DB: ${latestEntry.timestamp.toISOString()}`)
      // Detect resolution: check if latest entry is on a 15-min boundary
      const minutes = latestEntry.timestamp.getUTCMinutes()
      const is15Min = minutes % 15 === 0 && minutes !== 0

      // Increment by 15 min or 1 hour based on detected resolution
      const increment = is15Min ? 15 * 60 * 1000 : 60 * 60 * 1000
      start = new Date(latestEntry.timestamp.getTime() + increment)
      console.log(`Fetching from ${start.toISOString()} (detected ${is15Min ? '15-min' : 'hourly'} resolution)`)
    } else {
      start = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1, 0, 0, 0))
      console.log(`No entries in DB, starting from ${start.toISOString()}`)
    }

    // End at current time (but round down to the current hour)
    const now = new Date()
    let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0))

    // ENTSO-E API has limits - restrict to max 30 days per request to be safe
    const maxDays = 100
    const maxEndTime = new Date(start.getTime() + maxDays * 24 * 60 * 60 * 1000)
    if (end > maxEndTime) {
      console.log(`Limiting fetch from ${end.toISOString()} to ${maxEndTime.toISOString()} (${maxDays} day limit)`)
      end = maxEndTime
    }

    // Skip if start >= end (nothing to fetch)
    if (start >= end) {
      console.log('Database is up to date, no new prices to fetch')
      return NextResponse.json({
        message: 'No new prices to fetch (already up to date)',
        pricesCount: 0,
        insertedCount: 0
      })
    }

    const periodStart = formatDateUTC(start)
    const periodEnd = formatDateUTC(end)

    const EIC_CODE = '10YFI-1--------U'

    const url = `https://web-api.tp.entsoe.eu/api?documentType=A44&periodStart=${periodStart}&periodEnd=${periodEnd}&out_Domain=${EIC_CODE}&in_Domain=${EIC_CODE}&contract_MarketAgreement.type=A01&securityToken=${process.env.ENTSOE_TOKEN}`

    console.log(`Fetching prices from ENTSO-E API: ${start.toISOString()} to ${end.toISOString()}`)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`ENTSO-E API error (${response.status}):`, errorText)
      return new NextResponse(`Failed to fetch prices: ${errorText}`, { status: 500 })
    }

    const xml = await response.text()
    console.log('Fetched XML:', xml.slice(0, 200))

    const prices = parseEntsoeXML(xml)
    console.log(`Parsed ${prices.length} price entries`)

    // Insert prices into database
    let insertedCount = 0
    for (const price of prices) {
      try {
        await prisma.electricityPrice.upsert({
          where: { timestamp: price.timestamp },
          update: { spotPrice: price.spotPrice },
          create: {
            timestamp: price.timestamp,
            spotPrice: price.spotPrice
          }
        })
        insertedCount++
      } catch (error) {
        console.error(`Failed to insert price for ${price.timestamp}:`, error)
      }
    }

    console.log(`Successfully inserted/updated ${insertedCount} price entries`)
    console.log('=== Cron job completed successfully ===')

    return NextResponse.json({
      message: `Fetched ${prices.length} prices from ${periodStart} to ${periodEnd}, inserted/updated ${insertedCount}`,
      pricesCount: prices.length,
      insertedCount,
      success: true
    })
  } catch (err) {
    console.error('=== Cron job FAILED ===')
    console.error('Error details:', err)
    return NextResponse.json({
      error: 'Failed to update prices',
      details: err instanceof Error ? err.message : String(err),
      success: false
    }, { status: 500 })
  }
}

