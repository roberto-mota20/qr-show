import { useState } from 'react';
import { useRouter } from 'next/router';

export default function TextMode() {
  const router = useRouter();
  const [textData, setTextData] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = (e, targetPath) => {
    e.preventDefault();
    setError('');

    if (!textData.trim()) {
      setError('Digite algum texto.');
      return;
    }

    const encoded = encodeURIComponent(textData);
    if (targetPath === 'full') router.push(`/full/${encoded}`);
    else router.push(`/${encoded}`);
  };

  return (
    <div style={{width: '100%'}}>
        <textarea value={textData} onChange={(e) => setTextData(e.target.value)} placeholder="Digite seu texto aqui..." className="url-input" rows="4" required />
        
        {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
            <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
            <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
        </div>
    </div>
  );
}