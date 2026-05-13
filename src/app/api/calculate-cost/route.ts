// src/app/api/calculate-cost/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ConsumptionEntry = {
  timestamp: string
  consumption: number
}

type PriceEntry = {
  timestamp: Date
  spotPrice: number
}

export async function POST(req: Request) {
  try {
    const { consumption }: { consumption: ConsumptionEntry[] } = await req.json()

    if (consumption.length === 0) {
      return NextResponse.json({ cost: 0, totalConsumption: 0, averageSpotPrice: 0 })
    }

    // Get the time range for consumption data
    const timestamps = consumption.map(entry => new Date(entry.timestamp))
    const minTime = new Date(Math.min(...timestamps.map(t => t.getTime())))
    const maxTime = new Date(Math.max(...timestamps.map(t => t.getTime())))

    // Fetch all prices within the time range (not just exact matches)
    // This allows us to handle mixed resolutions
    const priceEntries = await prisma.electricityPrice.findMany({
      where: {
        timestamp: {
          gte: minTime,
          lte: maxTime,
        },
      },
      select: {
        timestamp: true,
        spotPrice: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    }) as PriceEntry[]

    // Create price lookup structures
    const exactPriceMap = new Map<string, number>()
    const pricesByHour = new Map<string, number[]>()
    const priceTimestamps = new Set<string>()

    priceEntries.forEach(entry => {
      const isoString = entry.timestamp.toISOString()
      exactPriceMap.set(isoString, entry.spotPrice)
      priceTimestamps.add(isoString)

      // Group prices by hour for averaging fallback
      const hourKey = isoString.substring(0, 13) // "2025-09-01T00"
      if (!pricesByHour.has(hourKey)) {
        pricesByHour.set(hourKey, [])
      }
      pricesByHour.get(hourKey)!.push(entry.spotPrice)
    })

    // Detect consumption resolution: check if we have non-hour timestamps (:15, :30, :45)
    const has15MinConsumption = consumption.some(entry => {
      const minutesPart = entry.timestamp.substring(14, 16)
      return minutesPart !== '00'
    })

    // Detect if we have 15-minute resolution prices
    // Check if any hour has more than 1 price entry
    const has15MinPrices = Array.from(pricesByHour.values()).some(prices => prices.length > 1)

    let totalConsumption = 0
    let totalCost = 0
    let totalPrice = 0

    const monthData = new Map<string, { consumption: number; priceSum: number; count: number }>()

    consumption.forEach(entry => {
      const timestampDate = new Date(entry.timestamp)
      const vatRate = timestampDate < new Date('2024-09-01T00:00:00Z') ? 1.24 : 1.255

      // Smart price matching:
      // 1. Try exact timestamp match first
      let price = exactPriceMap.get(entry.timestamp)

      // 2. If exact match found but we have hourly consumption with 15-min prices,
      //    we need to average the prices for that hour
      if (price !== undefined && !has15MinConsumption && has15MinPrices) {
        const hourKey = entry.timestamp.substring(0, 13)
        const hourPrices = pricesByHour.get(hourKey)

        // If this hour has multiple price points (15-min resolution), average them
        if (hourPrices && hourPrices.length > 1) {
          price = hourPrices.reduce((sum, p) => sum + p, 0) / hourPrices.length
        }
      }

      // 3. If no exact match, try to average prices within the same hour
      if (price === undefined) {
        const hourKey = entry.timestamp.substring(0, 13)
        const hourPrices = pricesByHour.get(hourKey)
        if (hourPrices && hourPrices.length > 0) {
          price = hourPrices.reduce((sum, p) => sum + p, 0) / hourPrices.length
        } else {
          // 4. Last resort: use 0
          price = 0
        }
      }

      const priceWithVAT = price * vatRate
      const costWithVAT = entry.consumption * priceWithVAT
      totalCost += costWithVAT
      totalConsumption += entry.consumption
      totalPrice += priceWithVAT

      // Track per-month data for käyttövaikutus B calculation
      const monthKey = entry.timestamp.substring(0, 7)
      if (!monthData.has(monthKey)) monthData.set(monthKey, { consumption: 0, priceSum: 0, count: 0 })
      const month = monthData.get(monthKey)!
      month.consumption += entry.consumption
      month.priceSum += priceWithVAT
      month.count += 1
    })

    const averageSpotPrice = consumption.length > 0 ? totalPrice / consumption.length : 0

    // B = sum over months of (E_month × avg_spotPrice_month) [eurocents]
    // Used for käyttövaikutus: adjustment = A - B = totalCost - kayttovaikutusBCents
    let kayttovaikutusBCents = 0
    monthData.forEach(m => {
      const monthAvg = m.count > 0 ? m.priceSum / m.count : 0
      kayttovaikutusBCents += m.consumption * monthAvg
    })
    const kayttovaikutusAdjustmentCents = totalCost - kayttovaikutusBCents

    return NextResponse.json({ cost: totalCost, totalConsumption, averageSpotPrice, kayttovaikutusAdjustmentCents })
  } catch (error) {
    console.error('Error in calculate-cost API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

