'use client'

import React from 'react'
import Link from 'next/link'
import FileDropZone from '@/components/FileUpload'

export default function HomePage() {

  return (
    <main>
      <div className="navbar-start">
        <div className="dropdown sticky ml-5 mt-5">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /> </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content outline-2 bg-black outline-gray-400 rounded-box z-1 mt-3 w-32 p-2 shadow font-sans">
            <li><Link href="/ohje-fingrid">Ohje Fingridin käyttöön</Link></li>
            <li><Link href="/miten-toimii">Miten laskuri toimii?</Link></li>
          </ul>
        </div>
      </div>
      <div className='flex flex-col items-center justify-center mt-15 font-sans'>
        <h1 className='text-7xl mb-10 text-gray-200 max-w-80 sm:max-w-screen font-extralight font-dm-sans'>Kumpi sähkö?</h1>
        <div className='max-w-80 sm:max-w-96'>
          <p className='text-xl mb-5 max-w-96 text-gray-400'>Oletko miettinyt kannattaisiko sinun ostaa pörssi- vai kiinteähintainen sopimus? Ota asiasta helposti selvää!</p>
          <FileDropZone />
        </div>
      </div>
    </main>
  )
}

