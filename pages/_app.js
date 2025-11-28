import '../styles/globals.css';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Componente principal que envolve todas as páginas.
// É aqui que importamos o CSS global e agora o Analytics + Speed Insights.
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      {/* Componente da página atual */}
      <Component {...pageProps} />
      
      {/* Ferramentas de Monitoramento Vercel */}
      <Analytics />
      <SpeedInsights />
    </>
  );
}