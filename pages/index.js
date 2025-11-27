import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const EMAIL_PROVIDERS = [
  '@gmail.com',
  '@outlook.com',
  '@hotmail.com',
  '@icloud.com',
  '@proton.me',
  '@yahoo.com'
];

export default function Home() {
  const router = useRouter();
  
  // Estado para controlar o tipo de QR Code
  const [mode, setMode] = useState('link'); // link | wifi | text | email

  // Estados dos dados dos formulários
  const [linkData, setLinkData] = useState('');
  const [textData, setTextData] = useState('');
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', security: 'WPA' });

  // Estados de Validação e UI
  const [error, setError] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingTargetPath, setPendingTargetPath] = useState('full'); // Para lembrar onde ir após o modal

  // Mapeamento dos modos
  const modes = [
    { id: 'link', label: 'Link' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'text', label: 'Texto' },
    { id: 'email', label: 'E-mail' },
  ];

  // Verifica se o campo atual está vazio
  const isContentEmpty = () => {
    switch (mode) {
      case 'link': return !linkData.trim();
      case 'text': return !textData.trim();
      case 'wifi': return !wifiData.ssid.trim();
      case 'email': return !emailData.to.trim();
      default: return true;
    }
  };

  // Funções de formatação de conteúdo para QR Code
  const formatContent = () => {
    switch (mode) {
      case 'link':
        // Lógica de Autocorreção de URL
        let url = linkData.trim().toLowerCase(); // Tudo minúsculo
        
        // Se não tiver ponto (indicando TLD como .com, .br), adiciona .com
        if (!url.includes('.')) {
          url += '.com';
        }
        
        // Se não tiver protocolo, adiciona https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        return url;

      case 'wifi':
        const securityType = wifiData.security || 'WPA';
        return `WIFI:T:${securityType};S:${wifiData.ssid};P:${wifiData.password};;`;

      case 'text':
        return textData;

      case 'email':
        return `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        
      default:
        return '';
    }
  };

  // Função genérica para gerar
  const handleGenerate = (e, targetPath) => {
    if (e) e.preventDefault();
    setError(''); // Limpa erros anteriores

    // 1. Validação de Vazio
    if (isContentEmpty()) {
      setError('Por favor, preencha as informações principais.');
      return;
    }

    // 2. Validação/Correção de E-mail
    if (mode === 'email' && !emailData.to.includes('@')) {
      setPendingTargetPath(targetPath); // Salva se o usuário queria ir pro Full ou Simple
      setShowEmailModal(true); // Abre o modal para escolher provedor
      return; // Para a execução aqui
    }

    const content = formatContent();
    
    // Validação extra de segurança para Wi-Fi
    if (mode === 'wifi' && (!wifiData.ssid || !wifiData.security)) {
      setError("Nome da rede é obrigatório.");
      return;
    }
    
    const encodedContent = encodeURIComponent(content);
    
    if (targetPath === 'full') {
       router.push(`/full/${encodedContent}`);
    } else {
       router.push(`/${encodedContent}`);
    }
  };

  // Função chamada ao clicar num provedor de email no Modal
  const handleProviderSelect = (suffix) => {
    // Atualiza o email com o provedor escolhido
    const newEmail = emailData.to + suffix;
    
    // Calcula o link final manualmente aqui para não depender do delay do 'setState'
    const finalEmailLink = `mailto:${newEmail}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    const encoded = encodeURIComponent(finalEmailLink);
    
    // Fecha modal e atualiza estado visualmente
    setEmailData({ ...emailData, to: newEmail });
    setShowEmailModal(false);
    
    // Redireciona usando o caminho que estava pendente
    if (pendingTargetPath === 'full') {
       router.push(`/full/${encoded}`);
    } else {
       router.push(`/${encoded}`);
    }
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
            placeholder="URL (ex: google)"
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
              required={wifiData.security !== 'nopass'} 
            />
            <select
              value={wifiData.security}
              onChange={(e) => setWifiData({ ...wifiData, security: e.target.value })}
              className="url-input"
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
              type="text" // text para permitir digitar sem @ inicialmente
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              placeholder="E-mail de Destino (ex: contato)"
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

      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>

      {/* Seletor de Modo */}
      <div className="mode-selector">
        {modes.map((m) => (
          <button
            key={m.id}
            className={`mode-button ${m.id === mode ? 'active' : ''}`}
            onClick={() => { setMode(m.id); setError(''); }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Formulário de Input */}
      <form className="qr-form">
        {renderForm()}
        
        {/* Mensagem de Erro (se houver) */}
        {error && <div className="error-msg">{error}</div>}

        {/* Grupo de Botões de Ação */}
        <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column' }}>
          
          {/* Botão Principal */}
          <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">
            Criar QR Code (Personalizável)
          </button>

          {/* Botão Secundário */}
          <button 
            onClick={(e) => handleGenerate(e, 'simple')} 
            className="submit-button"
            style={{ 
              backgroundColor: 'transparent', 
              border: '2px solid #007aff',
              color: '#007aff'
            }}
          >
            Criar QR Code (Rápido)
          </button>

        </div>
      </form>

      {/* Link Conheça o Projeto */}
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

      {/* --- MODAL DE SELEÇÃO DE EMAIL --- */}
      {showEmailModal && (
        <div className="email-modal-overlay">
          <div className="email-modal">
            <h3>Finalize seu E-mail</h3>
            <p>Você digitou "{emailData.to}". Escolha um provedor para completar:</p>
            
            <div className="provider-grid">
              {EMAIL_PROVIDERS.map((provider) => (
                <button 
                  key={provider} 
                  className="provider-btn"
                  onClick={() => handleProviderSelect(provider)}
                >
                  {provider}
                </button>
              ))}
            </div>

            <button className="close-modal-btn" onClick={() => setShowEmailModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}