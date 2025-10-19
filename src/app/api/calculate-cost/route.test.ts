import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    electricityPrice: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
const mockFindMany = prisma.electricityPrice.findMany as ReturnType<typeof vi.fn>

describe('calculate-cost API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Average spot price calculation', () => {
    it('should calculate average spot price correctly when all consumption entries have matching prices', async () => {
      // Setup test data
      const consumptionData = [
        { timestamp: '2024-01-01T00:00:00.000Z', consumption: 1.0 },
        { timestamp: '2024-01-01T01:00:00.000Z', consumption: 2.0 },
        { timestamp: '2024-01-01T02:00:00.000Z', consumption: 1.5 },
      ]

      const mockPrices = [
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), spotPrice: 10.0 },
        { timestamp: new Date('2024-01-01T01:00:00.000Z'), spotPrice: 20.0 },
        { timestamp: new Date('2024-01-01T02:00:00.000Z'), spotPrice: 30.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Average should be: (10*1.24 + 20*1.24 + 30*1.24) / 3 = 24.8
      // The bug causes it to divide by priceEntries.length (3) instead of consumption.length (3)
      // In this case they're equal, so test will pass
      expect(result.averageSpotPrice).toBeCloseTo(24.8, 1)
    })

    it('should calculate average spot price correctly when some prices are missing (bug test)', async () => {
      // This test exposes the bug where missing prices cause incorrect average calculation
      const consumptionData = [
        { timestamp: '2024-01-01T00:00:00.000Z', consumption: 1.0 },
        { timestamp: '2024-01-01T01:00:00.000Z', consumption: 2.0 },
        { timestamp: '2024-01-01T02:00:00.000Z', consumption: 1.5 },
        { timestamp: '2024-01-01T03:00:00.000Z', consumption: 1.0 },
      ]

      // Only 2 prices available (2 are missing)
      const mockPrices = [
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), spotPrice: 10.0 },
        { timestamp: new Date('2024-01-01T01:00:00.000Z'), spotPrice: 20.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Expected: (10*1.24 + 20*1.24 + 0*1.24 + 0*1.24) / 4 = 9.3
      // But bug divides by priceEntries.length (2): (10*1.24 + 20*1.24) / 2 = 18.6
      // This test should FAIL with current implementation
      expect(result.averageSpotPrice).toBeCloseTo(9.3, 1)
    })

    it('should handle empty price array gracefully', async () => {
      const consumptionData = [
        { timestamp: '2024-01-01T00:00:00.000Z', consumption: 1.0 },
      ]

      mockFindMany.mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.averageSpotPrice).toBe(0)
    })
  })

  describe('Total cost calculation', () => {
    it('should calculate total cost correctly with all matching prices', async () => {
      const consumptionData = [
        { timestamp: '2024-01-01T00:00:00.000Z', consumption: 1.0 },
        { timestamp: '2024-01-01T01:00:00.000Z', consumption: 2.0 },
      ]

      const mockPrices = [
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), spotPrice: 10.0 },
        { timestamp: new Date('2024-01-01T01:00:00.000Z'), spotPrice: 20.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Cost = (1.0 * 10.0 * 1.24) + (2.0 * 20.0 * 1.24) = 12.4 + 49.6 = 62.0
      expect(result.cost).toBeCloseTo(62.0, 1)
      expect(result.totalConsumption).toBe(3.0)
    })

    it('should apply correct VAT rate before September 2024', async () => {
      const consumptionData = [
        { timestamp: '2024-08-31T23:00:00.000Z', consumption: 1.0 },
      ]

      const mockPrices = [
        { timestamp: new Date('2024-08-31T23:00:00.000Z'), spotPrice: 10.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Cost with 24% VAT = 1.0 * 10.0 * 1.24 = 12.4
      expect(result.cost).toBeCloseTo(12.4, 1)
    })

    it('should apply correct VAT rate from September 2024 onwards', async () => {
      const consumptionData = [
        { timestamp: '2024-09-01T00:00:00.000Z', consumption: 1.0 },
      ]

      const mockPrices = [
        { timestamp: new Date('2024-09-01T00:00:00.000Z'), spotPrice: 10.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Cost with 25.5% VAT = 1.0 * 10.0 * 1.255 = 12.55
      expect(result.cost).toBeCloseTo(12.55, 1)
    })
  })

  describe('15-minute resolution handling', () => {
    it('should handle 15-minute resolution data correctly when aggregated to hourly', async () => {
      // Frontend aggregates 4x 15-min intervals into 1 hour
      const consumptionData = [
        { timestamp: '2024-01-01T00:00:00.000Z', consumption: 0.25 + 0.30 + 0.20 + 0.25 }, // 1.0 kWh total
      ]

      const mockPrices = [
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), spotPrice: 10.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.totalConsumption).toBe(1.0)
      expect(result.cost).toBeCloseTo(12.4, 1) // 1.0 * 10.0 * 1.24
    })

    it('should match timestamps correctly between aggregated consumption and 15-min price data', async () => {
      // This test checks if hourly aggregated consumption can match 15-min price data
      // In reality, if DB has 15-min prices, we need to either:
      // 1. Use the hour start price (00:00)
      // 2. Average the 4x 15-min prices
      // 3. Store hourly prices separately

      const consumptionData = [
        { timestamp: '2024-01-01T00:00:00.000Z', consumption: 1.0 }, // Aggregated hour
      ]

      // Database has 15-minute prices
      const mockPrices = [
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), spotPrice: 10.0 },
        // These won't match the aggregated timestamp:
        // { timestamp: new Date('2024-01-01T00:15:00.000Z'), spotPrice: 12.0 },
        // { timestamp: new Date('2024-01-01T00:30:00.000Z'), spotPrice: 11.0 },
        // { timestamp: new Date('2024-01-01T00:45:00.000Z'), spotPrice: 13.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Should use the 00:00 price only
      expect(result.cost).toBeCloseTo(12.4, 1)
    })
  })

  describe('Edge cases', () => {
    it('should handle missing prices by defaulting to 0', async () => {
      const consumptionData = [
        { timestamp: '2024-01-01T00:00:00.000Z', consumption: 1.0 },
        { timestamp: '2024-01-01T01:00:00.000Z', consumption: 2.0 },
      ]

      // Only one price available
      const mockPrices = [
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), spotPrice: 10.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Cost = (1.0 * 10.0 * 1.24) + (2.0 * 0 * 1.24) = 12.4
      expect(result.cost).toBeCloseTo(12.4, 1)
      expect(result.totalConsumption).toBe(3.0)
    })

    it('should handle empty consumption array', async () => {
      mockFindMany.mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: [] }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.cost).toBe(0)
      expect(result.totalConsumption).toBe(0)
      expect(result.averageSpotPrice).toBe(0)
    })
  })
})
