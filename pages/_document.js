import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Traditional favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        
        {/* Modern SVG favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}