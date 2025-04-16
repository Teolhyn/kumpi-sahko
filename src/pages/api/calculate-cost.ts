import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from '@/lib/prisma'

type ConsumptionEntry = {
  timestamp: string
  consumption: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { consumption }: { consumption: ConsumptionEntry[] } = req.body

      const timestamps = consumption.map(entry => entry.timestamp)

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

      let totalCostConstant = 0
      let constantPrice = 7
      let totalCost = 0
      consumption.forEach(entry => {
        const price = priceMap.get(entry.timestamp) ?? 0
        console.log(entry.timestamp, entry.consumption)
        totalCost += entry.consumption * price
        totalCostConstant += entry.consumption * constantPrice
      })


      return res.status(200).json({ cost: totalCost, costConstant: totalCostConstant })
    } catch (error) {
      console.error('Error in calculate-cost API:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
