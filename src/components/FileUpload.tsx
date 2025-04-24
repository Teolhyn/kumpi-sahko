'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const FileDropZone: React.FC = () => {
  const [cost, setCost] = useState<number | null>(null)
  const [totalConsumption, setTotalConsumption] = useState<number | null>(null)
  const [constantPrice, setConstantPrice] = useState<number>(7)
  const [marginal, setMarginal] = useState<number>(0.5)
  const [loading, setLoading] = useState<boolean>(false);
  const [averageCost, setAverageCost] = useState<number | null>(null)

  type consumptionEntry = {
    timestamp: string;
    consumption: number;
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string

      const lines = text.trim().split('\n')
      const hourlyMap = new Map<string, number>()
      lines.slice(1).map(line => {
        const [, , , , , timestamp, value,] = line.split(';')

        const date = new Date(timestamp)
        date.setMinutes(0, 0, 0)
        const hourKey = date.toISOString()
        const consumption = parseFloat(value.replace(',', '.'))
        const existing = hourlyMap.get(hourKey) || 0
        hourlyMap.set(hourKey, existing + consumption)
      })

      const parsed = Array.from(hourlyMap.entries()).map(([timestamp, consumption]) => ({
        timestamp,
        consumption,
      }))

      const calculateCost = async (data: consumptionEntry[]) => {
        try {
          setLoading(true);
          const response = await fetch('/api/calculate-cost', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              consumption: data,
            }),
          })

          const result = await response.json()
          if (response.ok) {
            setTotalConsumption(result.totalConsumption)
            setCost(result.cost / 100)
            console.log(result.averageSpotPrice)
            setAverageCost(result.averageSpotPrice)
          } else {
            console.error('Error calculating cost:', result.error)
          }
        } catch (err) {
          console.error('Error during API request:', err)
        } finally {
          setLoading(false);
        }
      }

      calculateCost(parsed)

      window.scrollBy({
        top: 1300,
        behavior: 'smooth'
      })
    }

    reader.readAsText(acceptedFiles[0])

  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const spotPriceCostWithoutMargin = (cost !== null && totalConsumption !== null)
    ? cost / totalConsumption * 100
    : 0

  const progressRatio = (spotPriceCostWithoutMargin !== 0 && averageCost !== null && totalConsumption !== null)
    ? (spotPriceCostWithoutMargin / averageCost)
    : 0

  const normalizedRatio = (spotPriceCostWithoutMargin !== 0 && averageCost !== null && totalConsumption !== null)
    ? ((progressRatio - 0.75) / (1.25 - 0.75))
    : 0

  let priceLevelLabel = ''
  if (normalizedRatio < 0.25) {
    priceLevelLabel = 'Kulutuksesi on ollut erittäin hyvin optimoitua.'
  } else if (normalizedRatio < 0.5) {
    priceLevelLabel = 'Sähkönkulutuksesi on keskittynyt keskimäärin halvemmille hinnoille.'
  } else if (normalizedRatio < 0.75) {
    priceLevelLabel = 'Sähkönkulutuksesi painottuu kalliimmille tunneille. Voit saada pörssisähköllä vielä edullisemman hinnan keskittämällä kulutuksesi halvempiin tunteihin.'
  } else {
    priceLevelLabel = 'Sähkönkulutuksesi on osunut useimmiten kalliimmille tunneille. Sinulla on mahdollisuus saada huomattavasti edullisempi hinta pörssisähköllä keskittämällä kulutuksesi halvempiin tunteihin.'
  }


  return (
    <div className='font-sans max-w-96 text-gray-400 mb-30'>
      <p className='text-xl mb-5'>
        1. Valitse kiinteän sopimuksen hinta johon pörssisopimusta verrataan.
      </p>
      <div className="w-full max-w-xs mb-10">
        <input type="range" value={constantPrice} min={0} max={20} className="range mb-5" step={0.1} onChange={(e) => setConstantPrice(parseFloat(e.target.value))} />
        <div>
          <span className='text-2xl'>{constantPrice.toFixed(1)}</span>
          <span> snt/kWh</span>
        </div>
      </div>
      <p className='text-xl mb-5'>
        2. Valitse pörssisähkön marginaali.
      </p>
      <div className="w-full max-w-xs mb-10">
        <input type="range" value={marginal} min={0} max={2} className="range mb-5" step={0.01} onChange={(e) => setMarginal(parseFloat(e.target.value))} />
        <div>
          <span className='text-2xl'>{marginal.toFixed(2)}</span>
          <span> snt/kWh</span>
        </div>
      </div>
      <p className='text-xl mb-5'>
        3. Lataa kulutustietosi <a href='https://oma.datahub.fi/#/login?returnUrl=%2F' target='_blank' rel='noopener noreferrer' className='underline underline-offset-4' >Fingridin palvelusta <FontAwesomeIcon icon={faUpRightFromSquare} size="2xs" className="" /></a> ja raahaa tiedosto alla olevaan kenttään.
      </p>
      <div {...getRootProps()} className='p-5 outline-2 outline-gray-400 rounded-md mb-10'>
        <input {...getInputProps()} />
        <p>{isDragActive ? 'Tiputa tiedosto tähän...' : "Lähetä kulutustietosi"}</p>
      </div>
      {loading ? (
        <div>
          <div className='flex justify-between gap-10 text-2xl'>
            <div className='flex flex-col items-start space-y-2'>
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-6 w-28"></div>
            </div>
            <div className='flex flex-col items-start space-y-2'>
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-6 w-28"></div>
            </div>
          </div>
          <div className="skeleton h-10 w-96 my-2"></div>
          <div className="skeleton h-20 w-96 my-2"></div>
        </div>
      ) :
        cost !== null && totalConsumption !== null && averageCost !== null && (
          <div>
            <div className='text-2xl flex justify-between'>
              <div>
                <h3
                  className={`text-3xl bg-clip-text text-transparent ${(cost + totalConsumption * marginal) < (totalConsumption * constantPrice / 100)
                    ? 'bg-gradient-to-t from-amber-200 to-amber-50'
                    : 'bg-gradient-to-t from-gray-200 to-white'
                    }`}
                >
                  {(cost + totalConsumption * marginal / 100).toFixed(2)} €
                </h3>
                <h3 className='text-xl'>Pörssisähköllä</h3>
              </div>
              <div>
                <h3
                  className={`text-3xl bg-clip-text text-transparent text-right ${(totalConsumption * constantPrice / 100) < (cost + totalConsumption * marginal)
                    ? 'bg-gradient-to-t from-amber-200 to-amber-50'
                    : 'bg-gradient-to-t from-gray-200 to-white'
                    }`}
                >
                  {(totalConsumption * constantPrice / 100).toFixed(2)} €
                </h3>
                <h3 className='text-xl'>Kiinteällä hinnalla</h3>
              </div>
            </div>
            <div className='flex justify-center items-center mt-10'>
              <span>- 25 %</span>
              <progress className="progress w-65 mx-2" value={normalizedRatio} max="1"></progress>
              <span>+ 25 %</span>
            </div>
            <div className='flex justify-center'>
              <span>|</span>
            </div>
            <span className='flex justify-center'>Keskihinta</span>
            <div className='flex justify-center mt-2'>
              <span>{priceLevelLabel}</span>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default FileDropZone

