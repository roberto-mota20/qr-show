import { useState } from 'react';
import { useRouter } from 'next/router';

export default function WifiMode() {
  const router = useRouter();
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', security: 'WPA' });
  const [error, setError] = useState('');

  const handleGenerate = (e, targetPath) => {
    e.preventDefault();
    setError('');

    if (!wifiData.ssid.trim()) {
      setError('Nome da rede é obrigatório.');
      return;
    }

    const content = `WIFI:T:${wifiData.security};S:${wifiData.ssid};P:${wifiData.password};;`;
    const encoded = encodeURIComponent(content);
    
    if (targetPath === 'full') router.push(`/full/${encoded}`);
    else router.push(`/${encoded}`);
  };

  return (
    <div style={{width: '100%'}}>
        <input type="text" value={wifiData.ssid} onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })} placeholder="Nome da Rede (ex: Kasper-Guest)" className="url-input" required />
        <input type="password" style={{marginTop: '1rem'}} value={wifiData.password} onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })} placeholder="Senha" className="url-input" />
        <select style={{marginTop: '1rem', padding: '10px'}} value={wifiData.security} onChange={(e) => setWifiData({ ...wifiData, security: e.target.value })} className="url-input">
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">Sem Senha</option>
        </select>

        {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
            <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
            <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
        </div>
    </div>
  );
}