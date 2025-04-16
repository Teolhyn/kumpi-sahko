'use client'

import React, { useState } from 'react'
import FileDropZone from '@/components/FileUpload'

type ConsumptionEntry = {
  timestamp: Date
  consumption: number
}

export default function HomePage() {

  const handleParsedData = async (data: ConsumptionEntry[]) => {
  }

  return (
    <main>
      <div className='flex flex-col items-center justify-center mt-20'>
        <h1>Kumpi sähkö?</h1>
        <FileDropZone onFileParsed={handleParsedData} />
      </div>
    </main>
  )
}

