import { useState } from 'react';
import { useRouter } from 'next/router';

const EMAIL_PROVIDERS = [
  '@gmail.com', '@outlook.com', '@hotmail.com', 
  '@icloud.com', '@proton.me', '@yahoo.com'
];

export default function EmailMode() {
  const router = useRouter();
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingTarget, setPendingTarget] = useState('full');

  const processGeneration = (emailTo, target) => {
    const finalLink = `mailto:${emailTo}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    const encoded = encodeURIComponent(finalLink);
    if (target === 'full') router.push(`/full/${encoded}`);
    else router.push(`/${encoded}`);
  };

  const handleGenerate = (e, targetPath) => {
    e.preventDefault();
    setError('');

    if (!emailData.to.trim()) {
      setError('O campo E-mail é obrigatório.');
      return;
    }

    if (!emailData.to.includes('@')) {
      setPendingTarget(targetPath);
      setShowModal(true);
      return;
    }

    processGeneration(emailData.to, targetPath);
  };

  const handleProviderSelect = (suffix) => {
    const newEmail = emailData.to + suffix;
    setEmailData({ ...emailData, to: newEmail });
    setShowModal(false);
    processGeneration(newEmail, pendingTarget);
  };

  return (
    <div style={{width: '100%'}}>
        <input type="text" value={emailData.to} onChange={(e) => setEmailData({ ...emailData, to: e.target.value })} placeholder="E-mail de Destino (ex: contato@kasper-labs.com)" className="url-input" required />
        <input type="text" style={{marginTop: '1rem'}} value={emailData.subject} onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })} placeholder="Assunto" className="url-input" />
        <textarea style={{marginTop: '1rem'}} value={emailData.body} onChange={(e) => setEmailData({ ...emailData, body: e.target.value })} placeholder="Mensagem" className="url-input" rows="3" />
        
        {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
            <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
            <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
        </div>

        {/* Modal */}
        {showModal && (
            <div className="email-modal-overlay">
            <div className="email-modal">
                <h3>Finalize seu E-mail</h3>
                <p>Você digitou "{emailData.to}". Escolha um provedor:</p>
                <div className="provider-grid">
                {EMAIL_PROVIDERS.map((provider) => (
                    <button key={provider} className="provider-btn" onClick={() => handleProviderSelect(provider)}>{provider}</button>
                ))}
                </div>
                <button className="close-modal-btn" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
            </div>
        )}
    </div>
  );
}