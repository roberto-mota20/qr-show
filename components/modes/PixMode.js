import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { generatePixCopyPaste, parseImportedPix } from '../../utils/pix';

export default function PixMode() {
  const router = useRouter();
  
  // Estados Locais
  const [pixTab, setPixTab] = useState('import'); // 'manual' | 'import'
  const [importString, setImportString] = useState('');
  const [pixData, setPixData] = useState({ pixKey: '', name: '', city: '', amount: '', txid: '' });
  const [pixHistory, setPixHistory] = useState([]);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Carregar histórico
  useEffect(() => {
    const savedHistory = localStorage.getItem('kasper_pix_history');
    if (savedHistory) {
      setPixHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Helpers de Histórico
  const saveToPixHistory = (data, isImported = false) => {
    const dataToSave = { ...data, amount: '', isImported };
    const newHistory = [dataToSave, ...pixHistory.filter(item => item.pixKey !== data.pixKey)];
    const limitedHistory = newHistory.slice(0, 10);
    setPixHistory(limitedHistory);
    localStorage.setItem('kasper_pix_history', JSON.stringify(limitedHistory));
  };

  const deleteFromHistory = (index) => {
    const newHistory = pixHistory.filter((_, i) => i !== index);
    setPixHistory(newHistory);
    localStorage.setItem('kasper_pix_history', JSON.stringify(newHistory));
  };

  const loadFromHistory = (item) => {
    setPixData({ ...item, amount: '' });
    setPixTab('manual');
    setError('');
  };

  // Ações
  const handleImportAction = () => {
    setError('');
    setSuccessMsg('');
    if (!importString.trim()) {
        setError('Cole um código Pix válido para importar.');
        return;
    }
    const parsed = parseImportedPix(importString.trim());
    if (parsed && parsed.pixKey) {
        saveToPixHistory(parsed, true);
        setPixData(parsed);
        setPixTab('manual');
        setSuccessMsg('Dados importados com sucesso! Verifique abaixo.');
    } else {
        setError('Não foi possível ler os dados deste código Pix.');
    }
  };

  const handleGenerate = (e, targetPath) => {
    if (e) e.preventDefault();
    setError('');
    
    if (pixTab === 'import') {
        setError('Por favor, clique em "Extrair e Salvar Dados" ou mude para a aba Manual.');
        return;
    }

    if (!pixData.pixKey.trim() || !pixData.name.trim() || !pixData.city.trim()) {
        setError('Por favor, preencha as informações obrigatórias.');
        return;
    }

    try {
        saveToPixHistory(pixData, false);
        const content = generatePixCopyPaste(pixData);
        const encodedContent = encodeURIComponent(content);
        
        if (targetPath === 'full') {
           router.push(`/full/${encodedContent}`);
        } else {
           router.push(`/${encodedContent}`);
        }
    } catch (err) {
        setError("Erro ao gerar Pix.");
    }
  };

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
                  <button 
                      type="button" 
                      className="submit-button" 
                      style={{marginTop: '10px', width: '100%', backgroundColor: '#333', border: '1px solid #555'}}
                      onClick={handleImportAction}
                  >
                      Extrair e Salvar Dados
                  </button>
                  <p className="import-note">Nós extrairemos os dados para o seu histórico.</p>
              </div>
          ) : (
              <>
                  <input type="text" value={pixData.pixKey} onChange={(e) => setPixData({ ...pixData, pixKey: e.target.value })} placeholder="Chave Pix (CPF, CNPJ, Email...)" className="url-input" required />
                  <input type="text" value={pixData.name} onChange={(e) => setPixData({ ...pixData, name: e.target.value })} placeholder="Nome do Beneficiário (Sem acentos)" className="url-input" required />
                  <input type="text" value={pixData.city} onChange={(e) => setPixData({ ...pixData, city: e.target.value })} placeholder="Cidade do Beneficiário (Sem acentos)" className="url-input" required />
                  <input type="number" value={pixData.amount} onChange={(e) => setPixData({ ...pixData, amount: e.target.value })} placeholder="Valor (Opcional)" className="url-input" step="0.01" />
                  <input type="text" value={pixData.txid} onChange={(e) => setPixData({ ...pixData, txid: e.target.value })} placeholder="Identificador (Opcional)" className="url-input" />
              </>
          )}
      </div>
      
      {/* Guia Lateral */}
      <div className="pix-guide-box">
          <h4>Guia Rápido Pix</h4>
          {pixTab === 'import' ? (
              <ul>
                  <li><b>Importar:</b> Garante dados 100% corretos do seu banco.</li>
                  <li><b>Como:</b> Gere um QR no app do banco, copie o código e cole aqui.</li>
              </ul>
          ) : (
              <ul>
                  <li><b>Chave:</b> CPF/CNPJ (apenas números), Email ou Aleatória.</li>
                  <li><b>Nome:</b> Exatamente como no banco.</li>
                  <li><b>TxID:</b> Código para identificar o pagamento.</li>
              </ul>
          )}
      </div>

      {/* Mensagens e Histórico (Renderizados dentro do componente para encapsulamento) */}
      <div style={{ width: '100%', marginTop: '1rem' }}>
          {error && <div className="error-msg">{error}</div>}
          {successMsg && <div className="error-msg" style={{color: '#34C759'}}>{successMsg}</div>}

          {/* Botões de Geração */}
          {pixTab !== 'import' && (
              <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column' }}>
                  <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
                  <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
              </div>
          )}

          {/* Histórico */}
          {pixHistory.length > 0 && (
              <div className="pix-history-area">
                  <div className="history-title">Chaves Salvas</div>
                  <div className="history-list">
                      {pixHistory.map((item, idx) => (
                          <div key={idx} className="history-item">
                              <div className="history-content" onClick={() => loadFromHistory(item)}>
                                  <div className="history-header">
                                      <span className="history-key" style={{color: '#007aff'}}>{item.name || 'Sem Nome'}</span>
                                      {item.isImported && <span className="import-tag">Oficial</span>}
                                  </div>
                                  <span className="history-meta">{item.pixKey} • {item.city}</span>
                              </div>
                              <button className="history-delete-btn" onClick={(e) => { e.preventDefault(); deleteFromHistory(idx); }}>&times;</button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}