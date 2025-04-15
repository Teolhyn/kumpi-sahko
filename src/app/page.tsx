'use client'

import React, { useState } from 'react'
import FileDropZone from '@/components/FileUpload'

type ConsumptionEntry = {
  timestamp: Date
  consumption: number
}

export default function HomePage() {
  const [result, setResult] = useState<number | null>(null)

  const handleParsedData = async (data: ConsumptionEntry[]) => {
    const safeData = data.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp).toISOString(),
    }))

    console.log(safeData)
  }

  return (
    <main>
      <h1>Electricity Cost Calculator</h1>
      <FileDropZone onFileParsed={handleParsedData} />
      {result !== null && (
        <p style={{ marginTop: '20px' }}>Estimated Total Cost: €{result.toFixed(2)}</p>
      )}
    </main>
  )
}

