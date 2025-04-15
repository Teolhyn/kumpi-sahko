'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

type Props = {
  onFileParsed: (data: any[]) => void
}

const FileDropZone: React.FC<Props> = ({ onFileParsed }) => {
  const [cost, setCost] = useState<number | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string

      const lines = text.trim().split('\n')
      const parsed = lines.map(line => {
        const [timestamp, value] = line.split(',')
        return { timestamp: new Date(timestamp), consumption: parseFloat(value) }
      })
      onFileParsed(parsed)
      calculateCost(parsed)
    }

    reader.readAsText(acceptedFiles[0])
  }, [onFileParsed])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const calculateCost = async (data: any[]) => {
    try {
      const response = await fetch('/api/calculate-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consumption: data }),
      })

      const result = await response.json()
      if (response.ok) {
        setCost(result.cost / 100)
      } else {
        console.error('Error calculating cost:', result.error)
      }
    } catch (err) {
      console.error('Error during API request:', err)
    }
  }

  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed #aaa', padding: '20px' }}>
        <input {...getInputProps()} />
        <p>{isDragActive ? 'Drop file here...' : "Upload your consumption data"}</p>
      </div>

      {cost !== null && (
        <div className='text-white'>
          <h3>Kustannus: {cost.toFixed(2)}€</h3>
        </div>
      )}
    </div>
  )
}

export default FileDropZone

