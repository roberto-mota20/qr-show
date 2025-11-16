import '../styles/globals.css'
import Head from 'next/head'

// Componente principal que envolve todas as páginas.
// É aqui que importamos o CSS global.
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}