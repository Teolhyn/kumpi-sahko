// src/app/api/fetch-new-prices/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type PriceEntry = {
  timestamp: Date
  spotPrice: number
}

function formatDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').slice(0, 12)
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== 'Bearer ${process.env.CRON_SECRET}') {
    return new NextResponse('Unauhtorized', { status: 401 })
  }
  const latestEntry = await prisma.electricityPrice.findFirst({
    orderBy: { timestamp: 'desc'},
  })
  
  let start = latestEntry ? new Date(latestEntry.timestamp.getTime() + 60 * 60 * 1000) : new Date(Date.UTC(2024, 0, 1, 0, 0, 0))

  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))

  const periodStart = formatDateUTC(start)
  const periodEnd = formatDateUTC(end)

  const EIC_CODE = '10YFI-1--------U'

  const url = `https://web-api.tp.entsoe.eu/api?documentType=A44&periodStart=${periodStart}&periodEnd=${periodEnd}&out_Domain=${EIC_CODE}&in_Domain=${EIC_CODE}&contract_MarketAgreement.type=A01&securityToken=${process.env.ENTSOE_API_KEY}`

  const response = await fetch(url)

  if (!response.ok) {
      console.error('Failed to fetch prices:', await response.text())
      return new NextResponse('Failed to fetch prices', { status: 500 })
    }

    const xml = await response.text()
    console.log('Fetched XML:', xml.slice(0, 200))

    // TODO: parse XML and insert prices

    return NextResponse.json({ message: `Fetched XML from ${periodStart} to ${periodEnd}` })
  } catch (err) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: 'Failed to update prices' }, { status: 500 })
  }
}

