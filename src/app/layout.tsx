import Script from 'next/script'
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["100", "200", "400", "700"],
});

export const metadata: Metadata = {
  title: "Sähkön hinta laskuri | Suoraan kulutusdatallasi",
  description: "Laske sähkökustannuksesi pörssihinnoilla ja kiinteällä hinnalla suoraan kulutusdatastasi.",
  keywords: [
    "sähkön hinta",
    "pörssisähkö",
    "kiinteä sähköhinta",
    "sähkölaskuri",
    "Fingrid",
    "Datahub",
    "pörssi vai kiinteä",
    "sähkönkulutus"
  ],
  metadataBase: new URL("https://www.xn--kumpishk-5za6p.fi"),
  openGraph: {
    title: "Sähkön hintalaskuri – Pörssi vs. kiinteä",
    description: "Vertaa helposti pörssi- ja kiinteähintaisen sähkön kokonaiskustannuksia Fingridin kulutusdatan avulla.",
    url: "https://www.xn--kumpishk-5za6p.fi",
    siteName: "Sähkön hintalaskuri",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sähkön hintalaskuri – esikatselu",
      },
    ],
    locale: "fi_FI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sähkön hintalaskuri",
    description: "Lataa kulutustietosi ja laske sähkön kokonaiskustannukset eri hinnoilla.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi" className="bg-black">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MSB6JQFVHS"
          strategy="afterInteractive"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MSB6JQFVHS');
            `,
          }}
        />
        <script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="b0d4b714-ce87-4802-a2e9-4f303f089cc9" type="text/javascript" async></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Sähkön hintalaskuri",
              "description": "Vertaa pörssi- ja kiinteähintaisen sähkön kustannuksia todellisten kulutustietojesi perusteella",
              "url": "https://www.xn--kumpishk-5za6p.fi",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              },
              "creator": {
                "@type": "Organization",
                "name": "Hynnä Consulting Oy"
              },
              "inLanguage": "fi",
              "audience": {
                "@type": "Audience",
                "geographicArea": {
                  "@type": "Country",
                  "name": "Finland"
                }
              }
            })
          }}
        />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${dmSans.variable} antialiased font-dm`}>

        <main className="min-h-screen mx-auto">{children}</main>

        <footer className="p-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Hynnä Consulting Oy. Hintatiedot perustuvat ENTSO-e Transparency Platformin tarjoamaan avoimeen dataan.
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
