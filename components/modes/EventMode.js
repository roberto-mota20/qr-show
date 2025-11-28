import { useState } from 'react';
// Removido import do useRouter para evitar erros de build no ambiente de preview
// import { useRouter } from 'next/router';

export default function EventMode() {
  // const router = useRouter();
  
  const [data, setData] = useState({
    title: '',
    location: '',
    start: '', // formato datetime-local: YYYY-MM-DDTHH:mm
    end: '',
    description: ''
  });
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Converte data do input (2023-12-25T20:00) para iCal (20231225T200000)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/[-:]/g, '') + '00';
  };

  const handleGenerate = (e, targetPath) => {
    e.preventDefault();
    setError('');

    if (!data.title.trim()) {
      setError('O título do evento é obrigatório.');
      return;
    }
    if (!data.start) {
      setError('A data de início é obrigatória.');
      return;
    }

    // Formato VEVENT Padrão
    let content = [
      'BEGIN:VEVENT',
      `SUMMARY:${data.title.trim()}`,
      `DTSTART:${formatDate(data.start)}`
    ];

    if (data.end) content.push(`DTEND:${formatDate(data.end)}`);
    if (data.location) content.push(`LOCATION:${data.location.trim()}`);
    if (data.description) content.push(`DESCRIPTION:${data.description.trim()}`);
    
    content.push('END:VEVENT');

    const finalString = content.join('\n');
    const encoded = encodeURIComponent(finalString);
    
    // Uso de window.location para garantir compatibilidade com o preview
    if (targetPath === 'full') {
       window.location.href = `/full/${encoded}`;
    } else {
       window.location.href = `/${encoded}`;
    }
  };

  return (
    <div style={{width: '100%'}}>
        <input 
            type="text" 
            value={data.title} 
            onChange={(e) => handleChange('title', e.target.value)} 
            placeholder="Título do Evento (ex: Festa da Empresa)" 
            className="url-input" 
            required 
        />
        
        <input 
            type="text" 
            style={{marginTop: '1rem'}} 
            value={data.location} 
            onChange={(e) => handleChange('location', e.target.value)} 
            placeholder="Local (Opcional)" 
            className="url-input" 
        />

        {/* CORREÇÃO DO LAYOUT:
            Removido o 'minWidth: 0' anterior que causava o vazamento.
            Definido 'minWidth: 250px' para garantir espaço suficiente para o calendário.
            Se a tela for menor que 2 colunas de 250px + gap, o flex-wrap do CSS global jogará um para baixo.
        */}
        <div className="form-row" style={{marginTop: '1rem'}}>
            <div style={{flex: 1, minWidth: '250px'}}>
                <label style={{color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem'}}>Início</label>
                <input 
                    type="datetime-local" 
                    value={data.start} 
                    onChange={(e) => handleChange('start', e.target.value)} 
                    className="url-input" 
                    required 
                />
            </div>
            <div style={{flex: 1, minWidth: '250px'}}>
                <label style={{color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem'}}>Fim (Opcional)</label>
                <input 
                    type="datetime-local" 
                    value={data.end} 
                    onChange={(e) => handleChange('end', e.target.value)} 
                    className="url-input" 
                />
            </div>
        </div>

        <textarea 
            style={{marginTop: '1rem'}} 
            value={data.description} 
            onChange={(e) => handleChange('description', e.target.value)} 
            placeholder="Descrição ou Notas..." 
            className="url-input" 
            rows="3" 
        />
        
        {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column', marginTop: '1rem' }}>
            <button onClick={(e) => handleGenerate(e, 'full')} className="submit-button">Criar QR Code (Personalizável)</button>
            <button onClick={(e) => handleGenerate(e, 'simple')} className="submit-button" style={{ backgroundColor: 'transparent', border: '2px solid #007aff', color: '#007aff' }}>Criar QR Code (Rápido)</button>
        </div>
    </div>
  );
}