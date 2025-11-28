import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { generateVCard } from '../../utils/vcard';

export default function VCardMode() {
  const router = useRouter();
  
  // Campos do vCard
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    website: '',
    org: '',
    title: '',
    street: '',
    city: '',
    state: '',
    country: ''
  });

  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  // Carregar histórico
  useEffect(() => {
    const saved = localStorage.getItem('kasper_vcard_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Helpers de Histórico
  const saveToHistory = (newData) => {
    // Chave única baseada em nome + telefone
    const newHistory = [newData, ...history.filter(item => item.phone !== newData.phone || item.firstName !== newData.firstName)];
    const limited = newHistory.slice(0, 10);
    setHistory(limited);
    localStorage.setItem('kasper_vcard_history', JSON.stringify(limited));
  };

  const deleteFromHistory = (index) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem('kasper_vcard_history', JSON.stringify(newHistory));
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

    // Validação Mínima: Nome e Telefone ou Email
    if (!data.firstName.trim()) {
        setError('O Primeiro Nome é obrigatório.');
        return;
    }
    if (!data.phone.trim() && !data.email.trim()) {
        setError('Preencha ao menos um Telefone ou E-mail.');
        return;
    }

    try {
        saveToHistory(data);
        const content = generateVCard(data);
        const encodedContent = encodeURIComponent(content);
        
        if (targetPath === 'full') {
           router.push(`/full/${encodedContent}`);
        } else {
           router.push(`/${encodedContent}`);
        }
    } catch (err) {
        setError("Erro ao gerar vCard.");
    }
  };

  return (
    <div className="vcard-wrapper">
      <div className="vcard-form-area">
          <div className="form-row">
            <input type="text" value={data.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Nome" className="url-input" required />
            <input type="text" value={data.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Sobrenome" className="url-input" />
          </div>
          
          <div className="form-row">
            <input type="text" value={data.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Telefone / Celular" className="url-input" />
            <input type="email" value={data.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="E-mail" className="url-input" />
          </div>

          <input type="text" value={data.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="Site / LinkedIn" className="url-input" />
          
          <div className="form-row">
            <input type="text" value={data.org} onChange={(e) => handleChange('org', e.target.value)} placeholder="Empresa" className="url-input" />
            <input type="text" value={data.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Cargo" className="url-input" />
          </div>

          {/* Endereço Simplificado */}
          <div className="form-row">
             <input type="text" value={data.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Cidade" className="url-input" />
             <input type="text" value={data.state} onChange={(e) => handleChange('state', e.target.value)} placeholder="Estado" className="url-input" />
          </div>
      </div>

      {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}

      <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
          <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
          <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
      </div>

      {/* Histórico vCard */}
      {history.length > 0 && (
          <div className="vcard-history-area">
              <div className="history-title">Contatos Salvos</div>
              <div className="history-list">
                  {history.map((item, idx) => (
                      <div key={idx} className="history-item">
                          <div className="history-content" onClick={() => loadFromHistory(item)}>
                              <div className="history-header">
                                  <span className="history-key" style={{color: '#007aff'}}>{item.firstName} {item.lastName}</span>
                              </div>
                              <span className="history-meta">{item.org ? `${item.org} • ` : ''}{item.phone || item.email}</span>
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