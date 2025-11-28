import { useState } from 'react';
import { useRouter } from 'next/router';

export default function MessageMode() {
  const router = useRouter();
  const [data, setData] = useState({ phone: '', message: '' });
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = (e, targetPath) => {
    e.preventDefault();
    setError('');

    if (!data.phone.trim()) {
      setError('O número de telefone é obrigatório.');
      return;
    }

    // Formato padrão para SMS: SMSTO:NUMERO:MENSAGEM
    const content = `SMSTO:${data.phone.trim()}:${data.message.trim()}`;
    const encoded = encodeURIComponent(content);
    
    if (targetPath === 'full') {
       router.push(`/full/${encoded}`);
    } else {
       router.push(`/${encoded}`);
    }
  };

  return (
    <div style={{width: '100%'}}>
        <input 
            type="tel" 
            value={data.phone} 
            onChange={(e) => handleChange('phone', e.target.value)} 
            placeholder="Número de Telefone (ex: 11999998888)" 
            className="url-input" 
            required 
        />
        
        <textarea 
            style={{marginTop: '1rem'}} 
            value={data.message} 
            onChange={(e) => handleChange('message', e.target.value)} 
            placeholder="Sua mensagem..." 
            className="url-input" 
            rows="4" 
        />
        
        {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
            <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
            <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
        </div>
    </div>
  );
}