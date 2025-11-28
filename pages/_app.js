import '../styles/globals.css';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';

// Componente principal que envolve todas as páginas.
// É aqui que importamos o CSS global e agora o Analytics.
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      {/* Componente da página atual */}
      <Component {...pageProps} />
      
      {/* Componente do Vercel Analytics (invisível na tela, mas coleta os dados) */}
      <Analytics />
    </>
  );
}