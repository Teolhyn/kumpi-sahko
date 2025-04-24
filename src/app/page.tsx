'use client'

import React from 'react'
import FileDropZone from '@/components/FileUpload'

export default function HomePage() {

  return (
    <main>
      <div className='flex flex-col items-center justify-center mt-20 font-sans'>
        <h1 className='text-7xl mb-10 text-gray-200 max-w-80 sm:max-w-screen font-extralight font-dm-sans'>Kumpi sähkö?</h1>
        <div className='max-w-80 sm:max-w-96'>
          <p className='text-xl mb-5 max-w-96 text-gray-400'>Oletko miettinyt kannattaisiko sinun ostaa pörssi- vai kiinteähintainen sopimus? Ota asiasta helposti selvää!</p>
          <FileDropZone />
        </div>
      </div>
    </main>
  )
}

