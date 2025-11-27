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

const formatPixField = (id, value) => {
  const val = value.toString();
  const len = val.length.toString().padStart(2, '0');
  return `${id}${len}${val}`;
};

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

const generatePixCopyPaste = ({ pixKey, name, city, amount, txid }) => {
  const key = pixKey.trim();
  // Normalização conforme manual do Bacen: sem acentos, max 25 chars para nome
  const safeName = name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
  const safeCity = city.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
  const safeTxid = txid.trim() || '***'; 
  
  let amountField = '';
  if (amount) {
    const formattedAmount = parseFloat(amount.replace(',', '.')).toFixed(2);
    amountField = formatPixField('54', formattedAmount);
  }

  let payload = [
    formatPixField('00', '01'), 
    formatPixField('26', 
      formatPixField('00', 'BR.GOV.BCB.PIX') + 
      formatPixField('01', key) 
    ),
    formatPixField('52', '0000'), 
    formatPixField('53', '986'), 
    amountField, 
    formatPixField('58', 'BR'), 
    formatPixField('59', safeName), 
    formatPixField('60', safeCity), 
    formatPixField('62', 
      formatPixField('05', safeTxid) 
    )
  ].join('');

  payload += '6304';
  payload += calculateCRC16(payload);

  return payload;
};

// --- PARSER DE IMPORTAÇÃO PIX (EMV MPM ROBUSTO) ---
// Lê sequencialmente ID -> TAMANHO -> VALOR para evitar erros de leitura
const parseEmv = (str) => {
  let i = 0;
  const result = {};
  while (i < str.length) {
    if (i + 4 > str.length) break; 
    const id = str.substring(i, i + 2);
    const lenStr = str.substring(i + 2, i + 4);
    
    if (!/^\d+$/.test(lenStr)) break;
    
    const len = parseInt(lenStr, 10);
    if (i + 4 + len > str.length) break; 
    
    const val = str.substring(i + 4, i + 4 + len);
    result[id] = val;
    i += 4 + len;
  }
  return result;
};

const parseImportedPix = (raw) => {
  try {
    const root = parseEmv(raw);
    const data = { pixKey: '', name: '', city: '', amount: '', txid: '' };

    // ID 59: Merchant Name (Nome do Recebedor)
    data.name = root['59'] || '';
    // ID 60: Merchant City
    data.city = root['60'] || '';
    // ID 54: Transaction Amount
    data.amount = root['54'] || '';

    // ID 26: Merchant Account Information (contém a Chave no ID 01)
    if (root['26']) {
      const merchantAccount = parseEmv(root['26']);
      data.pixKey = merchantAccount['01'] || '';
    }

    // ID 62: Additional Data Field (TxID no ID 05)
    if (root['62']) {
      const additionalData = parseEmv(root['62']);
      data.txid = additionalData['05'] || '';
    }

    return data;
  } catch (e) {
    console.error("Erro no parser:", e);
    return null;
  }
};


export default function Home() {
  const router = useRouter();
  
  const [mode, setMode] = useState('link'); 

  // Inputs Comuns
  const [linkData, setLinkData] = useState('');
  const [textData, setTextData] = useState('');
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', security: 'WPA' });
  
  // Inputs PIX
  const [pixTab, setPixTab] = useState('import'); // 'manual' | 'import'
  const [importString, setImportString] = useState(''); 
  const [pixData, setPixData] = useState({ pixKey: '', name: '', city: '', amount: '', txid: '' });
  const [pixHistory, setPixHistory] = useState([]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingTargetPath, setPendingTargetPath] = useState('full'); 

  useEffect(() => {
    const savedHistory = localStorage.getItem('kasper_pix_history');
    if (savedHistory) {
      setPixHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Salvar no histórico
  const saveToPixHistory = (data, isImported = false) => {
    // IMPORTANTE: Removemos o valor (amount) ao salvar no histórico
    // para que o item sirva como um template reutilizável.
    const dataToSave = { ...data, amount: '', isImported };
    
    // Filtra duplicatas baseadas na chave E no nome
    const newHistory = [dataToSave, ...pixHistory.filter(item => item.pixKey !== data.pixKey)];
    const limitedHistory = newHistory.slice(0, 10); // Aumentei para 10 itens
    
    setPixHistory(limitedHistory);
    localStorage.setItem('kasper_pix_history', JSON.stringify(limitedHistory));
  };

  const deleteFromHistory = (index) => {
    const newHistory = pixHistory.filter((_, i) => i !== index);
    setPixHistory(newHistory);
    localStorage.setItem('kasper_pix_history', JSON.stringify(newHistory));
  };

  const loadFromHistory = (item) => {
    // Carrega os dados do histórico para o formulário manual
    setPixData({ ...item, amount: '' }); // Garante que o valor venha vazio para nova transação
    setPixTab('manual'); 
    setError('');
  };

  // Ação do botão "Importar" na aba de Importação
  const handleImportAction = () => {
    setError('');
    setSuccessMsg('');
    
    if (!importString.trim()) {
        setError('Cole um código Pix válido para importar.');
        return;
    }

    const parsed = parseImportedPix(importString.trim());
    
    if (parsed && parsed.pixKey) {
        // 1. Salva no histórico (sem o valor, conforme lógica do saveToPixHistory)
        saveToPixHistory(parsed, true);
        
        // 2. Preenche o formulário manual com os dados importados
        // Mantemos o valor importado no formulário apenas para visualização momentânea, 
        // mas ele não foi para o histórico.
        setPixData(parsed);
        
        // 3. Muda para a aba manual para conferência
        setPixTab('manual');
        setSuccessMsg('Dados importados com sucesso! Verifique abaixo.');
    } else {
        setError('Não foi possível ler os dados deste código Pix. Verifique se está completo.');
    }
  };

  const modes = [
    { id: 'link', label: 'Link' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'text', label: 'Texto' },
    { id: 'email', label: 'E-mail' },
    { id: 'pix', label: 'Pix' }, 
  ];

  const isContentEmpty = () => {
    switch (mode) {
      case 'link': return !linkData.trim();
      case 'text': return !textData.trim();
      case 'wifi': return !wifiData.ssid.trim();
      case 'email': return !emailData.to.trim();
      case 'pix': 
        // Na aba import, não valida vazio aqui pois tem botão próprio
        if (pixTab === 'import') return false; 
        return !pixData.pixKey.trim() || !pixData.name.trim() || !pixData.city.trim();
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
        if (pixTab === 'import') {
             // Se o usuário tentar gerar direto da aba import, processamos igual ao botão importar
             // Mas idealmente ele usa o botão de ação.
             const parsed = parseImportedPix(importString);
             if (parsed && parsed.pixKey) return importString;
             throw new Error("Inválido");
        } else {
            // Manual
            // Salva no histórico (sem valor) antes de gerar o payload
            saveToPixHistory(pixData, false);
            return generatePixCopyPaste(pixData);
        }

      default:
        return '';
    }
  };

  const handleGenerate = (e, targetPath) => {
    if (e) e.preventDefault();
    setError(''); 
    setSuccessMsg('');

    // Bloqueio específico para Pix na aba Importar: forçar uso do botão de importação
    if (mode === 'pix' && pixTab === 'import') {
        setError('Por favor, clique em "Extrair e Salvar Dados" ou mude para a aba Manual.');
        return;
    }

    if (isContentEmpty()) {
      setError('Por favor, preencha as informações obrigatórias.');
      return;
    }

    if (mode === 'link' && linkData.length > MAX_LENGTH) {
        setError(`Texto muito longo.`);
        return;
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
    
    try {
        const content = formatContent();
        const encodedContent = encodeURIComponent(content);
        
        if (targetPath === 'full') {
           router.push(`/full/${encodedContent}`);
        } else {
           router.push(`/${encodedContent}`);
        }
    } catch (err) {
        setError("Erro ao processar dados.");
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
                
                {/* Abas */}
                <div className="pix-tabs">
                    <button 
                        className={`pix-tab-btn ${pixTab === 'import' ? 'active' : ''}`}
                        onClick={() => { setPixTab('import'); setError(''); setSuccessMsg(''); }}
                        type="button"
                    >
                        Importar (Recomendado)
                    </button>
                    <button 
                        className={`pix-tab-btn ${pixTab === 'manual' ? 'active' : ''}`}
                        onClick={() => { setPixTab('manual'); setError(''); setSuccessMsg(''); }}
                        type="button"
                    >
                        Manual
                    </button>
                </div>

                {pixTab === 'import' ? (
                    <div className="import-area">
                        <textarea
                            value={importString}
                            onChange={(e) => setImportString(e.target.value)}
                            placeholder="Cole aqui o código 'Pix Copia e Cola' (começa com 000201...)"
                        />
                        {/* Botão Específico de Importação */}
                        <button 
                            type="button" 
                            className="submit-button" 
                            style={{marginTop: '10px', width: '100%', backgroundColor: '#333', border: '1px solid #555'}}
                            onClick={handleImportAction}
                        >
                            Extrair e Salvar Dados
                        </button>
                        
                        <p className="import-note">
                            Isso extrairá os dados para o seu histórico e preencherá a aba Manual para você conferir.
                        </p>
                    </div>
                ) : (
                    <>
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
                        placeholder="Valor (Opcional - deixe vazio para livre)"
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
                    </>
                )}
            </div>
            
            {/* Guia Lateral */}
            <div className="pix-guide-box">
                <h4>Guia Rápido Pix</h4>
                {pixTab === 'import' ? (
                    <ul>
                        <li><b>Importar:</b> Extrai Chave, Nome e Cidade de um Pix existente.</li>
                        <li><b>Segurança:</b> Garante que os dados estão idênticos ao do banco.</li>
                        <li><b>Histórico:</b> Salva os dados sem o valor, para você reutilizar depois.</li>
                    </ul>
                ) : (
                    <ul>
                        <li><b>Chave:</b> Insira apenas números para CPF/CNPJ/Tel.</li>
                        <li><b>Nome:</b> Nome do titular da conta (máx 25 letras).</li>
                        <li><b>Cidade:</b> Cidade do titular da conta.</li>
                        <li><b>Valor:</b> Se deixar vazio, quem paga digita o valor.</li>
                    </ul>
                )}
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

      <div className="mode-selector">
        {modes.map((m) => (
          <button
            key={m.id}
            className={`mode-button ${m.id === mode ? 'active' : ''}`}
            onClick={() => { setMode(m.id); setError(''); setSuccessMsg(''); }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form className="qr-form" style={mode === 'pix' ? { maxWidth: '800px' } : {}}>
        {renderForm()}
        
        {error && <div className="error-msg">{error}</div>}
        {successMsg && <div className="error-msg" style={{color: '#34C759'}}>{successMsg}</div>}

        {/* Botões de Geração (Escondidos se estiver na aba de importação do Pix, para forçar fluxo) */}
        {!(mode === 'pix' && pixTab === 'import') && (
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
        )}

        {/* Histórico Pix */}
        {mode === 'pix' && pixHistory.length > 0 && (
            <div className="pix-history-area">
                <div className="history-title">Chaves Salvas (Sem Valor)</div>
                <div className="history-list">
                    {pixHistory.map((item, idx) => (
                        <div key={idx} className="history-item">
                            <div className="history-content" onClick={() => loadFromHistory(item)}>
                                <div className="history-header">
                                    {/* Mostra o NOME em destaque, pois é o identificador mais humano */}
                                    <span className="history-key" style={{color: '#007aff'}}>{item.name || 'Sem Nome'}</span>
                                    {item.isImported && <span className="import-tag">Oficial</span>}
                                </div>
                                {/* Mostra a Chave e Cidade abaixo */}
                                <span className="history-meta">
                                    {item.pixKey} • {item.city}
                                </span>
                            </div>
                            <button className="history-delete-btn" onClick={(e) => { e.preventDefault(); deleteFromHistory(idx); }} title="Remover">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
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