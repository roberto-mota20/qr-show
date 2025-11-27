import { useState } from 'react';
import Head from 'next/head';

// Importando os Módulos
import LinkMode from '../components/modes/LinkMode';
import WifiMode from '../components/modes/WifiMode';
import TextMode from '../components/modes/TextMode';
import EmailMode from '../components/modes/EmailMode';
import PixMode from '../components/modes/PixMode';

export default function Home() {
  const [mode, setMode] = useState('link');

  const modes = [
    { id: 'link', label: 'Link' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'text', label: 'Texto' },
    { id: 'email', label: 'E-mail' },
    { id: 'pix', label: 'Pix' },
  ];

  const renderModule = () => {
    switch (mode) {
      case 'link': return <LinkMode />;
      case 'wifi': return <WifiMode />;
      case 'text': return <TextMode />;
      case 'email': return <EmailMode />;
      case 'pix': return <PixMode />;
      default: return null;
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Gerador Qr | Kasper-Labs</title>
        <meta name="description" content="Gerador de QR Code Multiuso da Kasper-Labs: Link, Wi-Fi, Texto, E-mail e Pix." />
      </Head>

      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>

      <div className="mode-selector">
        {modes.map((m) => (
          <button
            key={m.id}
            className={`mode-button ${m.id === mode ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Renderiza o Módulo Ativo */}
      <form className="qr-form" style={mode === 'pix' ? { maxWidth: '800px' } : {}}>
        {renderModule()}
      </form>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
        <a 
          href="https://www.kasper-labs.com" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#007aff', textDecoration: 'none', cursor: 'pointer' }}
          onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.target.style.textDecoration = 'none'}
        >
          Conheça o projeto
        </a>
      </div>
    </div>
  );
}