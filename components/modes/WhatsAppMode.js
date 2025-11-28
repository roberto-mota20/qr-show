import { useState } from 'react';
import { useRouter } from 'next/router';

// Lista de DDIs comuns
const COUNTRY_CODES = [
  { label: 'Brasil (+55)', code: '55' },
  { label: 'EUA/Canadá (+1)', code: '1' },
  { label: 'Portugal (+351)', code: '351' },
  { label: 'Argentina (+54)', code: '54' },
  { label: 'Reino Unido (+44)', code: '44' },
  { label: 'Alemanha (+49)', code: '49' }
];

export default function WhatsAppMode() {
  const router = useRouter();
  const [data, setData] = useState({ phone: '', message: '' });
  const [error, setError] = useState('');
  
  // Estado para o Modal de País
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [pendingTarget, setPendingTarget] = useState('full');

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
    // Se tiver menos que isso, é inválido. Se tiver mais, provavelmente já tem DDI.
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        setPendingTarget(targetPath);
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
            placeholder="WhatsApp (ex: 11999998888)" 
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

        {/* Modal de Seleção de País */}
        {showCountryModal && (
            <div className="picker-modal-overlay">
            <div className="picker-modal">
                <h3>Faltou o Código do País?</h3>
                <p>Seu número parece curto. Escolha o código do país para completar:</p>
                <div className="picker-grid">
                {COUNTRY_CODES.map((country) => (
                    <button 
                        key={country.code} 
                        className="picker-btn" 
                        onClick={() => handleCountrySelect(country.code)}
                        style={country.code === '55' ? {borderColor: '#007aff', color: '#007aff', fontWeight: 'bold'} : {}}
                    >
                        {country.label}
                    </button>
                ))}
                </div>
                {/* Opção para prosseguir sem adicionar nada (caso o número seja curto mesmo) */}
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