import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function BitcoinMode() {
  const router = useRouter();
  
  // Campos: Endereço, Quantia (opcional), Etiqueta, Mensagem
  const [data, setData] = useState({ address: '', amount: '', label: '', message: '' });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  // Carregar histórico
  useEffect(() => {
    const saved = localStorage.getItem('kasper_bitcoin_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Helpers de Histórico
  const saveToHistory = (newData) => {
    // Salva no histórico (chave única pelo endereço)
    const newHistory = [newData, ...history.filter(item => item.address !== newData.address)];
    const limited = newHistory.slice(0, 5); // Mantém os últimos 5
    setHistory(limited);
    localStorage.setItem('kasper_bitcoin_history', JSON.stringify(limited));
  };

  const deleteFromHistory = (index) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem('kasper_bitcoin_history', JSON.stringify(newHistory));
  };

  const loadFromHistory = (item) => {
    setData(item);
    setError('');
  };

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = (e, targetPath) => {
    e.preventDefault();
    setError('');

    if (!data.address.trim()) {
      setError('O endereço da carteira é obrigatório.');
      return;
    }

    // Validação básica de comprimento de endereço BTC (geralmente 26-62 chars)
    if (data.address.trim().length < 26) {
        setError('O endereço parece muito curto para ser válido.');
        return;
    }

    try {
        saveToHistory(data);
        
        // Monta a URI BIP 21 (bitcoin:address?amount=...)
        let content = `bitcoin:${data.address.trim()}`;
        const params = [];
        
        if (data.amount) params.push(`amount=${data.amount}`);
        if (data.label) params.push(`label=${encodeURIComponent(data.label.trim())}`);
        if (data.message) params.push(`message=${encodeURIComponent(data.message.trim())}`);
        
        if (params.length > 0) {
            content += `?${params.join('&')}`;
        }

        const encodedContent = encodeURIComponent(content);
        
        if (targetPath === 'full') {
           router.push(`/full/${encodedContent}`);
        } else {
           router.push(`/${encodedContent}`);
        }
    } catch (err) {
        setError("Erro ao gerar QR Code Bitcoin.");
    }
  };

  return (
    <div className="bitcoin-wrapper">
      <div className="bitcoin-form-area">
          <input 
            type="text" 
            value={data.address} 
            onChange={(e) => handleChange('address', e.target.value)} 
            placeholder="Endereço da Carteira (ex: 1A1zP1eP...)" 
            className="url-input" 
            required 
          />
          
          <div className="form-row" style={{marginTop: '0.8rem'}}>
            <input 
                type="number" 
                value={data.amount} 
                onChange={(e) => handleChange('amount', e.target.value)} 
                placeholder="Quantia (BTC)" 
                className="url-input" 
                step="0.00000001" 
            />
            <input 
                type="text" 
                value={data.label} 
                onChange={(e) => handleChange('label', e.target.value)} 
                placeholder="Etiqueta (ex: Doação)" 
                className="url-input" 
            />
          </div>

          <textarea 
            style={{marginTop: '0.8rem'}} 
            value={data.message} 
            onChange={(e) => handleChange('message', e.target.value)} 
            placeholder="Mensagem para o recebedor..." 
            className="url-input" 
            rows="2" 
          />
      </div>

      {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}

      <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
          <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
          <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
      </div>

      {/* Histórico Bitcoin */}
      {history.length > 0 && (
          <div className="bitcoin-history-area">
              <div className="history-title">Carteiras Salvas</div>
              <div className="history-list">
                  {history.map((item, idx) => (
                      <div key={idx} className="history-item">
                          <div className="history-content" onClick={() => loadFromHistory(item)}>
                              <div className="history-header">
                                  <span className="history-key" style={{color: '#007aff'}}>{item.label || 'Sem Rótulo'}</span>
                              </div>
                              <span className="history-meta">{item.address.substring(0, 20)}...</span>
                          </div>
                          <button className="history-delete-btn" onClick={(e) => { e.preventDefault(); deleteFromHistory(idx); }}>&times;</button>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}