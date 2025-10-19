import { describe, it, expect, vi, beforeEach } from 'vitest'

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

describe('calculate-cost API - 15-minute resolution smart matching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Exact timestamp matching (15min → 15min)', () => {
    it('should match 15-minute consumption with 15-minute prices exactly', async () => {
      // This is the ideal case: both consumption and prices are at 15-min resolution
      const { POST } = await import('./route')

      const consumptionData = [
        { timestamp: '2025-09-01T00:00:00.000Z', consumption: 0.25 },
        { timestamp: '2025-09-01T00:15:00.000Z', consumption: 0.30 },
        { timestamp: '2025-09-01T00:30:00.000Z', consumption: 0.20 },
        { timestamp: '2025-09-01T00:45:00.000Z', consumption: 0.25 },
      ]

      const mockPrices = [
        { timestamp: new Date('2025-09-01T00:00:00.000Z'), spotPrice: 10.0 },
        { timestamp: new Date('2025-09-01T00:15:00.000Z'), spotPrice: 12.0 },
        { timestamp: new Date('2025-09-01T00:30:00.000Z'), spotPrice: 11.0 },
        { timestamp: new Date('2025-09-01T00:45:00.000Z'), spotPrice: 13.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Cost = (0.25*10 + 0.30*12 + 0.20*11 + 0.25*13) * 1.255
      // = (2.5 + 3.6 + 2.2 + 3.25) * 1.255 = 11.55 * 1.255 = 14.495
      expect(result.cost).toBeCloseTo(14.495, 2)
      expect(result.totalConsumption).toBe(1.0)
    })
  })

  describe('Exact timestamp matching (hourly → hourly)', () => {
    it('should match hourly consumption with hourly prices exactly', async () => {
      // This is the old behavior: both at hourly resolution
      const { POST } = await import('./route')

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
  })

  describe('Mixed resolution - averaging fallback', () => {
    it('should average 15-min prices when consumption is hourly but only 15-min prices available', async () => {
      // Transition period: consumption is hourly, but prices moved to 15-min
      const { POST } = await import('./route')

      const consumptionData = [
        { timestamp: '2025-09-01T00:00:00.000Z', consumption: 1.0 }, // Hourly consumption
      ]

      // Only 15-minute prices available
      const mockPrices = [
        { timestamp: new Date('2025-09-01T00:00:00.000Z'), spotPrice: 10.0 },
        { timestamp: new Date('2025-09-01T00:15:00.000Z'), spotPrice: 12.0 },
        { timestamp: new Date('2025-09-01T00:30:00.000Z'), spotPrice: 11.0 },
        { timestamp: new Date('2025-09-01T00:45:00.000Z'), spotPrice: 13.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Should average the 4 prices: (10 + 12 + 11 + 13) / 4 = 11.5
      // Cost = 1.0 * 11.5 * 1.255 = 14.4325
      expect(result.cost).toBeCloseTo(14.4325, 2)
      expect(result.totalConsumption).toBe(1.0)
    })

    it('should use hour-start price when 15-min consumption but only hourly prices available', async () => {
      // Transition period: consumption moved to 15-min, but prices still hourly
      const { POST } = await import('./route')

      const consumptionData = [
        { timestamp: '2025-09-01T00:00:00.000Z', consumption: 0.25 },
        { timestamp: '2025-09-01T00:15:00.000Z', consumption: 0.30 },
        { timestamp: '2025-09-01T00:30:00.000Z', consumption: 0.20 },
        { timestamp: '2025-09-01T00:45:00.000Z', consumption: 0.25 },
      ]

      // Only hourly price available
      const mockPrices = [
        { timestamp: new Date('2025-09-01T00:00:00.000Z'), spotPrice: 10.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // All 4 intervals should use the 00:00 price of 10.0
      // Cost = (0.25 + 0.30 + 0.20 + 0.25) * 10.0 * 1.255 = 1.0 * 10.0 * 1.255 = 12.55
      expect(result.cost).toBeCloseTo(12.55, 2)
      expect(result.totalConsumption).toBe(1.0)
    })

    it('should handle partial matches - some 15-min prices missing', async () => {
      // Real-world scenario: some 15-min prices available, some missing
      const { POST } = await import('./route')

      const consumptionData = [
        { timestamp: '2025-09-01T00:00:00.000Z', consumption: 0.25 },
        { timestamp: '2025-09-01T00:15:00.000Z', consumption: 0.30 },
        { timestamp: '2025-09-01T00:30:00.000Z', consumption: 0.20 },
        { timestamp: '2025-09-01T00:45:00.000Z', consumption: 0.25 },
      ]

      // Only 2 out of 4 prices available
      const mockPrices = [
        { timestamp: new Date('2025-09-01T00:00:00.000Z'), spotPrice: 10.0 },
        { timestamp: new Date('2025-09-01T00:30:00.000Z'), spotPrice: 11.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // 00:00 -> exact match: 10.0
      // 00:15 -> fallback to hour average: (10.0 + 11.0) / 2 = 10.5
      // 00:30 -> exact match: 11.0
      // 00:45 -> fallback to hour average: (10.0 + 11.0) / 2 = 10.5
      // Cost = (0.25*10 + 0.30*10.5 + 0.20*11 + 0.25*10.5) * 1.255
      // = (2.5 + 3.15 + 2.2 + 2.625) * 1.255 = 10.475 * 1.255 = 13.146
      expect(result.cost).toBeCloseTo(13.146, 2)
      expect(result.totalConsumption).toBe(1.0)
    })
  })

  describe('Edge cases with smart matching', () => {
    it('should handle completely missing prices by using 0', async () => {
      const { POST } = await import('./route')

      const consumptionData = [
        { timestamp: '2025-09-01T00:00:00.000Z', consumption: 1.0 },
      ]

      // No prices available at all
      mockFindMany.mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.cost).toBe(0)
      expect(result.totalConsumption).toBe(1.0)
      expect(result.averageSpotPrice).toBe(0)
    })

    it('should correctly calculate average price with mixed resolution', async () => {
      const { POST } = await import('./route')

      const consumptionData = [
        { timestamp: '2025-09-01T00:00:00.000Z', consumption: 0.25 },
        { timestamp: '2025-09-01T00:15:00.000Z', consumption: 0.30 },
        { timestamp: '2025-09-01T00:30:00.000Z', consumption: 0.20 },
        { timestamp: '2025-09-01T00:45:00.000Z', consumption: 0.25 },
      ]

      const mockPrices = [
        { timestamp: new Date('2025-09-01T00:00:00.000Z'), spotPrice: 10.0 },
        { timestamp: new Date('2025-09-01T00:15:00.000Z'), spotPrice: 12.0 },
        { timestamp: new Date('2025-09-01T00:30:00.000Z'), spotPrice: 11.0 },
        { timestamp: new Date('2025-09-01T00:45:00.000Z'), spotPrice: 13.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Average = (10*1.255 + 12*1.255 + 11*1.255 + 13*1.255) / 4
      // = (12.55 + 15.06 + 13.805 + 16.315) / 4 = 14.4325
      expect(result.averageSpotPrice).toBeCloseTo(14.4325, 2)
    })
  })

  describe('Multi-hour period with 15-min resolution', () => {
    it('should correctly calculate cost across multiple hours with 15-min data', async () => {
      const { POST } = await import('./route')

      // 2 hours of 15-min data
      const consumptionData = [
        // Hour 1
        { timestamp: '2025-09-01T00:00:00.000Z', consumption: 0.25 },
        { timestamp: '2025-09-01T00:15:00.000Z', consumption: 0.30 },
        { timestamp: '2025-09-01T00:30:00.000Z', consumption: 0.20 },
        { timestamp: '2025-09-01T00:45:00.000Z', consumption: 0.25 },
        // Hour 2
        { timestamp: '2025-09-01T01:00:00.000Z', consumption: 0.30 },
        { timestamp: '2025-09-01T01:15:00.000Z', consumption: 0.35 },
        { timestamp: '2025-09-01T01:30:00.000Z', consumption: 0.25 },
        { timestamp: '2025-09-01T01:45:00.000Z', consumption: 0.30 },
      ]

      const mockPrices = [
        // Hour 1
        { timestamp: new Date('2025-09-01T00:00:00.000Z'), spotPrice: 10.0 },
        { timestamp: new Date('2025-09-01T00:15:00.000Z'), spotPrice: 12.0 },
        { timestamp: new Date('2025-09-01T00:30:00.000Z'), spotPrice: 11.0 },
        { timestamp: new Date('2025-09-01T00:45:00.000Z'), spotPrice: 13.0 },
        // Hour 2
        { timestamp: new Date('2025-09-01T01:00:00.000Z'), spotPrice: 15.0 },
        { timestamp: new Date('2025-09-01T01:15:00.000Z'), spotPrice: 16.0 },
        { timestamp: new Date('2025-09-01T01:30:00.000Z'), spotPrice: 14.0 },
        { timestamp: new Date('2025-09-01T01:45:00.000Z'), spotPrice: 17.0 },
      ]

      mockFindMany.mockResolvedValue(mockPrices)

      const request = new Request('http://localhost:3000/api/calculate-cost', {
        method: 'POST',
        body: JSON.stringify({ consumption: consumptionData }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Hour 1: (0.25*10*1.255 + 0.30*12*1.255 + 0.20*11*1.255 + 0.25*13*1.255) = 14.49525
      // Hour 2: (0.30*15*1.255 + 0.35*16*1.255 + 0.25*14*1.255 + 0.30*17*1.255) = 23.4535
      // Total with VAT: ~37.95 (floating point precision)
      expect(result.cost).toBeCloseTo(37.95, 1)
      expect(result.totalConsumption).toBeCloseTo(2.2, 1)
    })
  })
})
