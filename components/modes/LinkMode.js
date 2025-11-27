import { useState } from 'react';
import { useRouter } from 'next/router';

const MAX_LENGTH = 2048;

export default function LinkMode() {
  const router = useRouter();
  const [linkData, setLinkData] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = (e, targetPath) => {
    e.preventDefault();
    setError('');

    if (!linkData.trim()) {
      setError('Por favor, preencha a URL.');
      return;
    }

    let url = linkData.trim().toLowerCase();
    if (!url.includes('.')) url += '.com';
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

    if (url.length > MAX_LENGTH) {
      setError('URL muito longa.');
      return;
    }

    const encodedContent = encodeURIComponent(url);
    if (targetPath === 'full') {
       router.push(`/full/${encodedContent}`);
    } else {
       router.push(`/${encodedContent}`);
    }
  };

  return (
    <div style={{width: '100%'}}>
      <input
        type="text"
        value={linkData}
        onChange={(e) => setLinkData(e.target.value)}
        placeholder="URL (ex: kasper-labs.com)"
        className="url-input"
        required
      />
      {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}
      
      <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
          <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
          <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
      </div>
    </div>
  );
}