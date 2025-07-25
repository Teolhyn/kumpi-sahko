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

        // Calculate resolution based on total period duration and number of points
        const totalDurationMs = endTime.getTime() - startTime.getTime()
        const resolutionMs = totalDurationMs / points.length

        for (const point of points) {
          const position = parseInt(point.position) - 1 // ENTSO-E uses 1-based indexing
          const priceValue = parseFloat(point['price.amount'])

          // Calculate timestamp based on dynamic resolution
          const timestamp = new Date(startTime.getTime() + position * resolutionMs)

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

export async function POST(req: Request) {
  console.log('=== fetch-new-prices endpoint called ===');
  try {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const latestEntry = await prisma.electricityPrice.findFirst({
      orderBy: { timestamp: 'desc' },
    })

    // If no latest entry, start from beginning of current year; otherwise continue from latest + 1 hour
    let start = latestEntry ?
      new Date(latestEntry.timestamp.getTime() + 60 * 60 * 1000) :
      new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1, 0, 0, 0))

    // End at current time (but round down to the current hour)
    const now = new Date()
    let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0))

    const periodStart = formatDateUTC(start)
    const periodEnd = formatDateUTC(end)

    const EIC_CODE = '10YFI-1--------U'

    const url = `https://web-api.tp.entsoe.eu/api?documentType=A44&periodStart=${periodStart}&periodEnd=${periodEnd}&out_Domain=${EIC_CODE}&in_Domain=${EIC_CODE}&contract_MarketAgreement.type=A01&securityToken=${process.env.ENTSOE_TOKEN}`

    const response = await fetch(url)

    if (!response.ok) {
      console.error('Failed to fetch prices:', await response.text())
      return new NextResponse('Failed to fetch prices', { status: 500 })
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

    return NextResponse.json({
      message: `Fetched ${prices.length} prices from ${periodStart} to ${periodEnd}, inserted/updated ${insertedCount}`,
      pricesCount: prices.length,
      insertedCount
    })
  } catch (err) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: 'Failed to update prices' }, { status: 500 })
  }
}

