import { useState, useEffect } from 'react';
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

const MAX_LENGTH = 2048;

// --- FUNÇÕES AUXILIARES PARA O PIX ---

// Função para formatar os campos do Pix (ID + Tamanho + Valor)
const formatPixField = (id, value) => {
  const val = value.toString();
  const len = val.length.toString().padStart(2, '0');
  return `${id}${len}${val}`;
};

// Função para calcular o CRC16 (Padrão CCITT-FALSE)
const calculateCRC16 = (payload) => {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

// Função Principal que Gera o Código Pix Copia e Cola
const generatePixCopyPaste = ({ pixKey, name, city, amount, txid }) => {
  // Tratamento dos dados
  const key = pixKey.trim();
  // Remove acentos e caracteres especiais para compatibilidade máxima (padrão EMV safe)
  const safeName = name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
  const safeCity = city.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
  const safeTxid = txid.trim() || '***'; // Padrão se vazio é ***
  
  // Se houver valor, formata (ex: 10.00). Se não, não inclui o campo.
  let amountField = '';
  if (amount) {
    const formattedAmount = parseFloat(amount.replace(',', '.')).toFixed(2);
    amountField = formatPixField('54', formattedAmount);
  }

  // Montagem do Payload
  let payload = [
    formatPixField('00', '01'), // Payload Format Indicator
    formatPixField('26', // Merchant Account Information
      formatPixField('00', 'BR.GOV.BCB.PIX') + // GUI
      formatPixField('01', key) // Chave
    ),
    formatPixField('52', '0000'), // Merchant Category Code
    formatPixField('53', '986'), // Transaction Currency (BRL)
    amountField, // Transaction Amount (Opcional)
    formatPixField('58', 'BR'), // Country Code
    formatPixField('59', safeName), // Merchant Name
    formatPixField('60', safeCity), // Merchant City
    formatPixField('62', // Additional Data Field
      formatPixField('05', safeTxid) // Reference Label (TxID)
    )
  ].join('');

  // Adiciona o ID do CRC16 '63' e o tamanho '04'
  payload += '6304';

  // Calcula e adiciona o CRC
  payload += calculateCRC16(payload);

  return payload;
};


export default function Home() {
  const router = useRouter();
  
  // Estado para controlar o tipo de QR Code
  const [mode, setMode] = useState('link'); // link | wifi | text | email | pix

  // Estados dos dados dos formulários
  const [linkData, setLinkData] = useState('');
  const [textData, setTextData] = useState('');
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', security: 'WPA' });
  
  // Estado do PIX
  const [pixData, setPixData] = useState({ pixKey: '', name: '', city: '', amount: '', txid: '' });
  const [pixHistory, setPixHistory] = useState([]);

  // Estados de Validação e UI
  const [error, setError] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingTargetPath, setPendingTargetPath] = useState('full'); 

  // Carregar histórico do LocalStorage ao iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('kasper_pix_history');
    if (savedHistory) {
      setPixHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Salvar no histórico
  const saveToPixHistory = (data) => {
    // Evita duplicatas exatas no topo
    const newHistory = [data, ...pixHistory.filter(item => item.pixKey !== data.pixKey || item.name !== data.name)];
    // Limita a 5 itens
    const limitedHistory = newHistory.slice(0, 5);
    setPixHistory(limitedHistory);
    localStorage.setItem('kasper_pix_history', JSON.stringify(limitedHistory));
  };

  const deleteFromHistory = (index) => {
    const newHistory = pixHistory.filter((_, i) => i !== index);
    setPixHistory(newHistory);
    localStorage.setItem('kasper_pix_history', JSON.stringify(newHistory));
  };

  const loadFromHistory = (item) => {
    setPixData(item);
    setError(''); // Limpa erros ao carregar
  };

  // Mapeamento dos modos
  const modes = [
    { id: 'link', label: 'Link' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'text', label: 'Texto' },
    { id: 'email', label: 'E-mail' },
    { id: 'pix', label: 'Pix' }, // Novo Modo
  ];

  // Verifica se o campo atual está vazio
  const isContentEmpty = () => {
    switch (mode) {
      case 'link': return !linkData.trim();
      case 'text': return !textData.trim();
      case 'wifi': return !wifiData.ssid.trim();
      case 'email': return !emailData.to.trim();
      case 'pix': return !pixData.pixKey.trim() || !pixData.name.trim() || !pixData.city.trim();
      default: return true;
    }
  };

  const formatContent = () => {
    switch (mode) {
      case 'link':
        let url = linkData.trim().toLowerCase(); 
        if (!url.includes('.')) url += '.com';
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
        return url;

      case 'wifi':
        return `WIFI:T:${wifiData.security || 'WPA'};S:${wifiData.ssid};P:${wifiData.password};;`;

      case 'text':
        return textData;

      case 'email':
        return `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        
      case 'pix':
        // Salva no histórico antes de gerar
        saveToPixHistory(pixData);
        // Gera o payload Pix
        return generatePixCopyPaste(pixData);

      default:
        return '';
    }
  };

  const handleGenerate = (e, targetPath) => {
    if (e) e.preventDefault();
    setError(''); 

    if (isContentEmpty()) {
      setError('Por favor, preencha as informações obrigatórias.');
      return;
    }

    if (mode === 'link') {
        // Validação de tamanho
        if (linkData.length > MAX_LENGTH) {
            setError(`Texto muito longo.`);
            return;
        }
    }

    if (mode === 'email' && !emailData.to.includes('@')) {
      setPendingTargetPath(targetPath); 
      setShowEmailModal(true); 
      return; 
    }
    
    if (mode === 'wifi' && (!wifiData.ssid || !wifiData.security)) {
      setError("Nome da rede é obrigatório.");
      return;
    }
    
    const content = formatContent();
    const encodedContent = encodeURIComponent(content);
    
    if (targetPath === 'full') {
       router.push(`/full/${encodedContent}`);
    } else {
       router.push(`/${encodedContent}`);
    }
  };

  const handleProviderSelect = (suffix) => {
    const newEmail = emailData.to + suffix;
    const finalEmailLink = `mailto:${newEmail}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    const encoded = encodeURIComponent(finalEmailLink);
    
    setEmailData({ ...emailData, to: newEmail });
    setShowEmailModal(false);
    
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
            placeholder="URL (ex: kasper-labs.com)"
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
              placeholder="Nome da Rede (ex: Kasper-Guest)"
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
            placeholder="Digite o texto... (ex: Bem-vindo à Kasper Labs!)"
            className="url-input"
            rows="4"
            required
          />
        );

      case 'email':
        return (
          <>
            <input
              type="text" 
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              placeholder="E-mail de Destino (ex: contato@kasper-labs.com)"
              className="url-input"
              required
            />
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="Assunto (ex: Parceria Kasper)"
              className="url-input"
            />
            <textarea
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              placeholder="Mensagem (ex: Olá equipe Kasper...)"
              className="url-input"
              rows="3"
            />
          </>
        );

      case 'pix':
        return (
          <div className="pix-wrapper">
            <div className="pix-form-area">
                <input
                  type="text"
                  value={pixData.pixKey}
                  onChange={(e) => setPixData({ ...pixData, pixKey: e.target.value })}
                  placeholder="Chave Pix (CPF, CNPJ, Email, Tel ou Aleatória)"
                  className="url-input"
                  required
                />
                <input
                  type="text"
                  value={pixData.name}
                  onChange={(e) => setPixData({ ...pixData, name: e.target.value })}
                  placeholder="Nome do Beneficiário (Sem acentos)"
                  className="url-input"
                  required
                />
                <input
                  type="text"
                  value={pixData.city}
                  onChange={(e) => setPixData({ ...pixData, city: e.target.value })}
                  placeholder="Cidade do Beneficiário (Sem acentos)"
                  className="url-input"
                  required
                />
                <input
                  type="number"
                  value={pixData.amount}
                  onChange={(e) => setPixData({ ...pixData, amount: e.target.value })}
                  placeholder="Valor (Opcional - ex: 10.50)"
                  className="url-input"
                  step="0.01"
                />
                <input
                  type="text"
                  value={pixData.txid}
                  onChange={(e) => setPixData({ ...pixData, txid: e.target.value })}
                  placeholder="Identificador (Opcional - ex: PAGAMENTO01)"
                  className="url-input"
                />
            </div>
            
            {/* Guia Lateral */}
            <div className="pix-guide-box">
                <h4>Guia Rápido Pix</h4>
                <ul>
                    <li><b>Chave:</b> Insira apenas números para CPF/CNPJ/Tel.</li>
                    <li><b>Nome:</b> Use o nome exato da conta bancária. Evite acentos.</li>
                    <li><b>Cidade:</b> Cidade da conta bancária.</li>
                    <li><b>Valor:</b> Use ponto para centavos (ex: 1.50). Se deixar vazio, o pagador define.</li>
                    <li><b>TxID:</b> Código único para você identificar o pagamento.</li>
                </ul>
            </div>
          </div>
        );

      default:
        return null;
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
      <form className="qr-form" style={mode === 'pix' ? { maxWidth: '800px' } : {}}>
        {renderForm()}
        
        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
          <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">
            Criar QR Code (Personalizável)
          </button>

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

        {/* Histórico Pix (Apenas se estiver no modo Pix) */}
        {mode === 'pix' && pixHistory.length > 0 && (
            <div className="pix-history-area">
                <div className="history-title">Histórico Salvo (Local)</div>
                <div className="history-list">
                    {pixHistory.map((item, idx) => (
                        <div key={idx} className="history-item">
                            <div className="history-content" onClick={() => loadFromHistory(item)}>
                                <span className="history-key">{item.pixKey}</span>
                                <span className="history-meta">{item.name} - R$ {item.amount || 'Livre'}</span>
                            </div>
                            <button className="history-delete-btn" onClick={() => deleteFromHistory(idx)} title="Remover">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
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

      {/* Modal de Email */}
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