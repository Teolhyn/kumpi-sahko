import React from 'react'
import Link from 'next/link'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ohje Fingridin käyttöön | Sähkönkulutuksen hintalaskuri",
  description: "Opas sähkönkulutustietojen lataamiseen Fingridin Datahub-palvelusta. Opi käyttämään pörssisähkön hintalaskuria tehokkaasti.",
  keywords: [
    "Fingrid ohje",
    "Datahub käyttöohje",
    "sähkönkulutusdata",
    "kulutustietojen lataus",
    "CSV-tiedosto",
    "pörssisähkö laskuri ohje"
  ],
  openGraph: {
    title: "Ohje Fingridin käyttöön – Sähkön hintalaskuri",
    description: "Vaiheittainen opas sähkönkulutustietojen lataamiseen Fingridin palvelusta hintalaskuria varten.",
    url: "https://www.xn--kumpishk-5za6p.fi/ohje-fingrid",
    siteName: "Sähkön hintalaskuri",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fingrid käyttöohje",
      },
    ],
    locale: "fi_FI",
    type: "article",
  },
};

export default function OhjeFingridPage() {
  return (
    <main>
      <div className="navbar-start flex items-center">
        <div className="dropdown sticky ml-5 mt-5">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /> </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content outline-2 bg-black outline-gray-400 rounded-box z-1 mt-3 w-32 p-2 shadow font-sans">
            <li><Link href="/miten-toimii">Miten laskuri toimii?</Link></li>
          </ul>
        </div>
        <Link href="/" className='text-gray-400 hover:text-gray-200 text-lg font-sans ml-6 mt-5'>
          ← Takaisin laskuriin
        </Link>
      </div>
      <div className='flex flex-col items-center justify-center mt-15 font-sans'>
        <h1 className='text-7xl mb-10 text-gray-200 max-w-80 sm:max-w-screen font-extralight font-dm-sans'>Ohje Fingridin käyttöön</h1>
        <div className='max-w-80 sm:max-w-96 font-sans text-gray-400 mb-30'>
          <div className='text-xl mb-5'>
            <h2 className='text-2xl mb-3 text-gray-200'>1. Kirjaudu Fingridin palveluun</h2>
            <p className='mb-5'>Mene osoitteeseen <a href='https://oma.datahub.fi/#/login?returnUrl=%2F' target='_blank' rel='noopener noreferrer' className='underline underline-offset-4'>oma.datahub.fi</a> ja kirjaudu sisään pankkitunnuksillasi tai mobiilivarmenteella.</p>

            <h2 className='text-2xl mb-3 text-gray-200'>2. Valitse aikaväli</h2>
            <p className='mb-5'>Valitse haluamasi aikaväli, jolta haluat ladata kulutustietosi. Suosittelemme vähintään 3-6 kuukauden ajanjaksoa luotettavan vertailun saamiseksi.</p>

            <h2 className='text-2xl mb-3 text-gray-200'>3. Lataa tiedot</h2>
            <p className='mb-5'>Klikkaa &quot;Lataa tiedot&quot; -painiketta ja tallenna CSV-tiedosto tietokoneellesi.</p>

            <h2 className='text-2xl mb-3 text-gray-200'>4. Käytä laskuria</h2>
            <p className='mb-5'>Palaa takaisin laskuriin ja raahaa lataamasi CSV-tiedosto laskurin kenttään. Laskuri analysoi automaattisesti kulutustietosi ja vertailee pörssi- ja kiinteähintaisen sähkön kustannuksia.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
