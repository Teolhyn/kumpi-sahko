import React from 'react'
import Link from 'next/link'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Miten laskuri toimii? | Sähkönkulutuksen hintalaskuri",
  description: "Ymmärrä miten pörssisähkön hintalaskuri toimii. Opi tulkitsemaan tuloksia ja optimoimaan sähkönkulutustasi.",
  keywords: [
    "sähkölaskuri toiminta",
    "pörssisähkö selitys",
    "sähkön optimointi",
    "ENTSO-e data",
    "kulutuksen analysointi",
    "sähkön hinta vertailu"
  ],
  openGraph: {
    title: "Miten laskuri toimii? – Sähkön hintalaskuri",
    description: "Selvitä miten pörssisähkön hintalaskuri laskee kustannuksesi ja miten tulkita tuloksia tehokkaasti.",
    url: "https://www.xn--kumpishk-5za6p.fi/miten-toimii",
    siteName: "Sähkön hintalaskuri",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Laskurin toiminta",
      },
    ],
    locale: "fi_FI",
    type: "article",
  },
};

export default function MitenToimiiPage() {
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
            <li><Link href="/ohje-fingrid">Ohje Fingridin käyttöön</Link></li>
          </ul>
        </div>
        <Link href="/" className='text-gray-400 hover:text-gray-200 text-lg font-sans ml-6 mt-5'>
          ← Takaisin laskuriin
        </Link>
      </div>
      <div className='flex flex-col items-center justify-center mt-15 font-sans'>
        <h1 className='text-7xl mb-10 text-gray-200 max-w-80 sm:max-w-screen font-extralight font-dm-sans'>Miten laskuri toimii?</h1>
        <div className='max-w-80 sm:max-w-96 font-sans text-gray-400 mb-30'>
          <div className='text-xl mb-5'>
            <p className='mb-5'>Tämä sähkön hintalaskuri auttaa sinua vertailemaan, kumpi sähkösopimus olisi sinulle edullisempi: pörssisähkö vai kiinteähintainen sopimus. Laskuri perustuu todellisiin kulutustietohisi, ja näyttää selkeästi, paljonko säästäisit eri vaihtoehdoilla. Lisäksi laskuri kertoo miten hyvin olet optimoinut sähkön kulutustasi.</p>
            <h2 className='text-2xl mb-3 text-gray-200'>Pörssisähkön laskenta</h2>
            <p className='mb-5'>Laskuri hakee historialliset pörssisähkön hinnat ENTSO-e Transparency Platformista ja laskee, paljonko sähkösi olisi maksanut tuntikohtaisilla pörssihinnoilla. Voit lisäksi lisätä hintaan sähkön myyjän marginaalin, jotta tulos vastaa todellista pörssisähkön hintaa sinulle.</p>

            <h2 className='text-2xl mb-3 text-gray-200'>Kiinteän hinnan laskenta</h2>
            <p className='mb-5'>Kiinteän sähkön hinnan laskeminen on suoraviivaista: yksinkertaisesti kulutuksesi (kWh) kerrotaan valitsemallasi kiinteällä hinnalla (esim. 9,5 snt/kWh). Näin näet helposti, olisiko kiinteä hinta ollut sinulle edullisempi vaihtoehto.</p>

            <h2 className='text-2xl mb-3 text-gray-200'>Kulutuksen optimointi</h2>
            <p className='mb-5'>Laskuri analysoi myös sitä, miten hyvin kulutuksesi on kohdistunut halvimpiin tunteihin. Tämä näkyy tuloksissa kätevänä palkkina</p>
            <ul className='list-disc list-inside space-y-2 mb-5'>
              <li><strong>Palkki keskikohdasta vasemmalla</strong> Kulutuksesi on keskittynyt halvimpiin tunteihin. Hyvä!</li>
              <li><strong>Palkki keskellä</strong> Olet käyttänyt sähköä hyvin tasaisesti.</li>
              <li><strong>Palkki keskikohdasta oikealla</strong> Kulutuksesi on painottunut kalliimpiin tunteihin. Voit saavuttaa vielä edullisemman hinnan pörssisähköllä käyttämällä sähköä enemmän halpojen tuntien aikana.</li>
            </ul>

            <h2 className='text-2xl mb-3 text-gray-200'>Hintatietojen lähde</h2>
            <p className='mb-5'>Kaikki hintatiedot perustuvat ENTSO-e Transparency Platformin tarjoamaan avoimeen dataan, joka on EU:n tarjoama datapalvelu kaikesta energiaan liittyvästä.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
