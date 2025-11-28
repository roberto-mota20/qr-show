import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { countries } from '../../utils/countries';

export default function WhatsAppMode() {
  const router = useRouter();
  const [data, setData] = useState({ phone: '', message: '' });
  const [error, setError] = useState('');
  
  // Estado para o Modal de País
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [pendingTarget, setPendingTarget] = useState('full');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra países com base na busca (nome ou código)
  // useMemo evita recalcular a lista toda vez que outro estado mudar, só quando searchTerm mudar
  const filteredCountries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return countries.filter(country => 
      country.name.toLowerCase().includes(term) || 
      country.code.includes(term)
    );
  }, [searchTerm]);

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const processGeneration = (phoneWithDDI, target) => {
    const content = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(data.message.trim())}`;
    const encoded = encodeURIComponent(content);
    if (target === 'full') router.push(`/full/${encoded}`);
    else router.push(`/${encoded}`);
  };

  const handleGenerate = (e, targetPath) => {
    e.preventDefault();
    setError('');

    // Remove não dígitos
    const cleanPhone = data.phone.replace(/\D/g, '');

    if (!cleanPhone) {
      setError('O número de WhatsApp é obrigatório.');
      return;
    }

    // Lógica Inteligente:
    // Se o número tem 10 ou 11 dígitos, provavelmente é um celular BR sem DDI (DDD + 9xxxx-xxxx)
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        setPendingTarget(targetPath);
        setSearchTerm(''); // Limpa a busca ao abrir
        setShowCountryModal(true); // Abre modal para confirmar o país
        return;
    }

    processGeneration(cleanPhone, targetPath);
  };

  const handleCountrySelect = (code) => {
    // Adiciona o DDI selecionado na frente do número existente
    const cleanPhone = data.phone.replace(/\D/g, '');
    const fullPhone = code + cleanPhone;
    
    // Atualiza o input visualmente também para o usuário ver
    setData(prev => ({ ...prev, phone: fullPhone }));
    setShowCountryModal(false);
    
    processGeneration(fullPhone, pendingTarget);
  };

  return (
    <div style={{width: '100%'}}>
        <input 
            type="tel" 
            value={data.phone} 
            onChange={(e) => handleChange('phone', e.target.value)} 
            placeholder="WhatsApp com DDD e DDI (ex: 5511999998888)" 
            className="url-input" 
            required 
        />
        
        <textarea 
            style={{marginTop: '1rem'}} 
            value={data.message} 
            onChange={(e) => handleChange('message', e.target.value)} 
            placeholder="Sua mensagem personalizada..." 
            className="url-input" 
            rows="4" 
        />
        
        {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
            <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
            <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
        </div>

        {/* Modal de Seleção de País com Busca */}
        {showCountryModal && (
            <div className="picker-modal-overlay">
            <div className="picker-modal">
                <h3>Faltou o Código do País?</h3>
                <p>Seu número parece curto. Pesquise e escolha o código:</p>
                
                {/* Campo de Pesquisa */}
                <input 
                  type="text" 
                  className="picker-search-input"
                  placeholder="Pesquisar país ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />

                {/* Lista de Países (Grid) */}
                <div className="picker-list-container">
                  <div className="country-grid">
                    {filteredCountries.map((country) => (
                        <div 
                            key={country.code + country.name} 
                            className="country-item" 
                            onClick={() => handleCountrySelect(country.code)}
                            style={country.code === '55' && country.name === 'Brasil' ? {borderColor: '#007aff'} : {}}
                        >
                            <span className="country-name">{country.name}</span>
                            <span className="country-code">+{country.code}</span>
                        </div>
                    ))}
                    {filteredCountries.length === 0 && (
                      <p style={{gridColumn: '1 / -1', color: '#666', marginTop: '1rem'}}>Nenhum país encontrado.</p>
                    )}
                  </div>
                </div>

                <button 
                    className="close-modal-btn" 
                    onClick={() => { setShowCountryModal(false); processGeneration(data.phone.replace(/\D/g, ''), pendingTarget); }}
                    style={{color: '#888', marginTop: '1rem', fontSize: '0.8rem'}}
                >
                    Não adicionar código (Manter assim)
                </button>
            </div>
            </div>
        )}
    </div>
  );
}