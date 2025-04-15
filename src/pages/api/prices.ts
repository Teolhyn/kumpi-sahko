import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { timestamp, spotPrice } = req.body

    try {
      const result = await prisma.electricityPrice.upsert({
        where: { timestamp: new Date(timestamp) },
        update: { spotPrice },
        create: {
          timestamp: new Date(timestamp),
          spotPrice
        },
      })

      res.status(200).json(result)
    } catch (error) {
      res.status(500).json({ error: 'Failed to store price' })
    }
  }

  if (req.method === 'GET') {
    const prices = await prisma.electricityPrice.findMany({
      orderBy: { timestamp: 'asc' },
    })
    res.status(200).json(prices)
  }
}
