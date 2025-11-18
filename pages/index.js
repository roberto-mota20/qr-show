import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  
  // Estado para controlar o tipo de QR Code
  const [mode, setMode] = useState('link'); // link | wifi | text | email

  // Estados dos dados dos formulários
  const [linkData, setLinkData] = useState('');
  const [textData, setTextData] = useState('');
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', security: 'WPA' });

  // Mapeamento dos modos para facilitar a renderização
  const modes = [
    { id: 'link', label: 'Link' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'text', label: 'Texto' },
    { id: 'email', label: 'E-mail' },
  ];

  // Funções de formatação de conteúdo para QR Code
  const formatContent = () => {
    switch (mode) {
      case 'link':
        let finalUrl = linkData.trim();
        // Adiciona "https://" se o protocolo não for encontrado
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = 'https://' + finalUrl;
        }
        return finalUrl;

      case 'wifi':
        // Formato padrão Wi-Fi: WIFI:T:<SECURITY>;S:<SSID>;P:<PASSWORD>;;
        const securityType = wifiData.security || 'WPA';
        return `WIFI:T:${securityType};S:${wifiData.ssid};P:${wifiData.password};;`;

      case 'text':
        return textData;

      case 'email':
        // Formato padrão E-mail: mailto:<email>?subject=<assunto>&body=<body>
        return `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        
      default:
        return '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = formatContent();
    
    if (!content || (mode === 'wifi' && (!wifiData.ssid || !wifiData.security))) {
      console.error("Conteúdo vazio ou incompleto.");
      return;
    }
    
    // CORREÇÃO DE ROTA: Codifica o conteúdo e envia para a página de admin
    const encodedContent = encodeURIComponent(content);
    router.push(`/admin/${encodedContent}`); // Manda para o Modo Completo
  };

  // Renderização dos Formulários
  const renderForm = () => {
    switch (mode) {
      case 'link':
        return (
          <input
            type="text"
            value={linkData}
            onChange={(e) => setLinkData(e.target.value)}
            placeholder="Cole sua URL aqui (ex: kasper-labs.com)"
            className="url-input"
            required
          />
        );

      case 'wifi':
        return (
          <>
            <input
              type="text"
              value={wifiData.ssid}
              onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
              placeholder="Nome da Rede (SSID)"
              className="url-input"
              required
            />
            <input
              type="password"
              value={wifiData.password}
              onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
              placeholder="Senha"
              className="url-input"
              required={wifiData.security !== 'nopass'} // Senha só é obrigatória se não for 'Sem Senha'
            />
            <select
              value={wifiData.security}
              onChange={(e) => setWifiData({ ...wifiData, security: e.target.value })}
              className="url-input" // Reutiliza o estilo de input
              style={{ padding: '10px' }}
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">Sem Senha (Aberto)</option>
            </select>
          </>
        );

      case 'text':
        return (
          <textarea
            value={textData}
            onChange={(e) => setTextData(e.target.value)}
            placeholder="Digite o texto que o QR Code deve conter..."
            className="url-input"
            rows="4"
            required
          />
        );

      case 'email':
        return (
          <>
            <input
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              placeholder="E-mail de Destino"
              className="url-input"
              required
            />
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="Assunto (Opcional)"
              className="url-input"
            />
            <textarea
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              placeholder="Corpo da Mensagem (Opcional)"
              className="url-input"
              rows="3"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Gerador Qr | Kasper-Labs</title>
        <meta name="description" content="Gerador de QR Code Multiuso da Kasper-Labs: Link, Wi-Fi, Texto e E-mail." />
      </Head>

      {/* Logo da Kasper-Labs */}
      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>

      {/* Seletor de Modo */}
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

      {/* Formulário de Input */}
      <form onSubmit={handleSubmit} className="qr-form">
        {renderForm()}
        <button type="submit" className="submit-button">
          Gerar QR Code de {modes.find(m => m.id === mode)?.label}
        </button>
      </form>

      {/* Hiperlink para o projeto, usando <a> tag para ser um hiperlink real */}
      <div className="project-link">
        <a href="https://www.kasper-labs.com" target="_blank" rel="noopener noreferrer">
          Conheça o projeto
        </a>
      </div>
    </div>
  );
}