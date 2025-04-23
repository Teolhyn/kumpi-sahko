// src/app/api/calculate-cost/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { consumption } = await req.json()

    const timestamps = consumption.map((entry: any) => entry.timestamp)

    const priceEntries = await prisma.electricityPrice.findMany({
      where: {
        timestamp: { in: timestamps },
      },
      select: {
        timestamp: true,
        spotPrice: true,
      },
    })

    const priceMap = new Map<string, number>()
    priceEntries.forEach(entry => {
      priceMap.set(entry.timestamp.toISOString(), entry.spotPrice)
    })

    let totalConsumption = 0
    let totalCost = 0
    let totalPrice = 0

    consumption.forEach((entry: any) => {
      const price = priceMap.get(entry.timestamp) ?? 0
      const timestampDate = new Date(entry.timestamp)
      const vatRate = timestampDate < new Date('2024-09-01T00:00:00Z') ? 1.24 : 1.255
      const costWithVAT = entry.consumption * price * vatRate
      totalCost += costWithVAT
      totalConsumption += entry.consumption
      totalPrice += price * vatRate
    })

    const averageSpotPrice = priceEntries.length > 0 ? totalPrice / priceEntries.length : 0

    return NextResponse.json({ cost: totalCost, totalConsumption, averageSpotPrice })
  } catch (error) {
    console.error('Error in calculate-cost API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

