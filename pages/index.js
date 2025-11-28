import { useState } from 'react';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

// Importando os Módulos
import LinkMode from '../components/modes/LinkMode';
import WifiMode from '../components/modes/WifiMode';
import TextMode from '../components/modes/TextMode';
import EmailMode from '../components/modes/EmailMode';
import PixMode from '../components/modes/PixMode';
import VCardMode from '../components/modes/VCardMode';
import MessageMode from '../components/modes/MessageMode';
import WhatsAppMode from '../components/modes/WhatsAppMode';
import BitcoinMode from '../components/modes/BitcoinMode'; // Novo Import
import SimpleMarkdown from '../components/SimpleMarkdown';

// Função que roda no servidor (Build time) para ler o arquivo MD
export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'content', 'explainer.md');
  let explainerContent = '';

  try {
    explainerContent = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error("Erro ao ler arquivo markdown:", err);
    explainerContent = "## Erro\nNão foi possível carregar o conteúdo explicativo.";
  }

  return {
    props: {
      explainerContent,
    },
  };
}

export default function Home({ explainerContent }) {
  const [mode, setMode] = useState('link');
  const [showExplainer, setShowExplainer] = useState(false);

  const modes = [
    { id: 'link', label: 'Link' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'text', label: 'Texto' },
    { id: 'email', label: 'E-mail' },
    { id: 'message', label: 'SMS' },
    { id: 'vcard', label: 'vCard' },
    { id: 'pix', label: 'Pix' },
    { id: 'bitcoin', label: 'Bitcoin' }, // Novo Botão
  ];

  const renderModule = () => {
    switch (mode) {
      case 'link': return <LinkMode />;
      case 'whatsapp': return <WhatsAppMode />;
      case 'wifi': return <WifiMode />;
      case 'text': return <TextMode />;
      case 'email': return <EmailMode />;
      case 'pix': return <PixMode />;
      case 'vcard': return <VCardMode />;
      case 'message': return <MessageMode />;
      case 'bitcoin': return <BitcoinMode />; // Renderiza
      default: return null;
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Gerador Qr | Kasper-Labs</title>
        <meta name="description" content="Gerador de QR Code Multiuso da Kasper-Labs: Link, WhatsApp, Bitcoin, vCard, Wi-Fi, Texto e Pix." />
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
      <form className="qr-form" style={mode === 'pix' || mode === 'vcard' || mode === 'bitcoin' ? { maxWidth: '800px' } : {}}>
        {renderModule()}
      </form>

      {/* Seção Explicativa Colapsável */}
      <div className="explainer-wrapper">
        <button 
          className={`explainer-toggle ${showExplainer ? 'active' : ''}`} 
          onClick={() => setShowExplainer(!showExplainer)}
          type="button"
        >
          {showExplainer ? 'Ocultar detalhes do projeto ▲' : 'Entenda como funciona ▼'}
        </button>
        
        {showExplainer && (
          <div className="explainer-content">
            <SimpleMarkdown content={explainerContent} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', fontSize: '0.9rem', borderTop: '1px solid #333', paddingTop: '2rem', width: '100%', textAlign: 'center' }}>
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