import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { timestamp, spotPrice } = await req.json()

    const result = await prisma.electricityPrice.upsert({
      where: { timestamp: new Date(timestamp) },
      update: { spotPrice },
      create: {
        timestamp: new Date(timestamp),
        spotPrice,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error storing price:', error)
    return NextResponse.json(
      { error: 'Failed to store price' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const prices = await prisma.electricityPrice.findMany({
      orderBy: { timestamp: 'asc' },
    })
    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}

