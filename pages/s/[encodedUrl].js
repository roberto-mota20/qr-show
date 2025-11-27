import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
importHc from 'next/head';
import QRCodeStyling from 'qr-code-styling';
import html2canvas from 'html2canvas';

// Tipos de estilos disponíveis para seleção
const DOT_STYLES = [
  { id: 'square', label: 'Quadrado' },
  { id: 'rounded', label: 'Redondo' },
  { id: 'dots', label: 'Pontos' },
  { id: 'classy', label: 'Elegante' },
  { id: 'classy-rounded', label: 'Elegante (Curvo)' },
  { id: 'extra-rounded', label: 'Extra Curvo' },
];

const CORNER_STYLES = [
  { id: 'square', label: 'Quadrado' },
  { id: 'rounded', label: 'Redondo' },
  { id: 'dot', label: 'Ponto' },
];

// Componente de Análise de Conteúdo (Parse)
const parseQrContent = (content) => {
  if (!content) return { type: 'Texto', details: { text: '' } }; 
  
  if (content.startsWith('WIFI:')) {
    const data = {};
    const parts = content.substring(5).slice(0, -2).split(';').map(p => p.trim());
    parts.forEach(part => {
      if (part.startsWith('T:')) data.security = part.substring(2);
      if (part.startsWith('S:')) data.ssid = part.substring(2);
      if (part.startsWith('P:')) data.password = part.substring(2);
    });
    return { type: 'Wi-Fi', details: data };
  } else if (content.startsWith('mailto:')) {
    const [recipientPart, queryPart] = content.substring(7).split('?');
    const data = { to: recipientPart };
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      data.subject = params.get('subject') ? decodeURIComponent(params.get('subject')) : '';
      data.body = params.get('body') ? decodeURIComponent(params.get('body')) : '';
    }
    return { type: 'E-mail', details: data };
  } else if (content.startsWith('http://') || content.startsWith('https://')) {
    return { type: 'Link', details: { url: content } };
  } else {
    return { type: 'Texto', details: { text: content } };
  }
};

// Componente de Detalhes do Conteúdo
const ContentDetails = ({ content }) => {
  const { type, details } = parseQrContent(content);
  const Title = ({ text }) => <h3 className="detail-title">{text}</h3>;
  const DetailItem = ({ label, value }) => (
    <div className="detail-item">
      <span className="detail-label">{label}:</span>
      <span className="detail-value">{value}</span>
    </div>
  );

  let detailContent;
  switch (type) {
    case 'Wi-Fi':
      detailContent = ( <div className="detail-group"> <Title text="Dados da Rede Wi-Fi" /> <DetailItem label="SSID (Rede)" value={details.ssid || 'N/A'} /> <DetailItem label="Segurança" value={details.security || 'N/A'} /> <DetailItem label="Senha" value={details.password ? 'Sim (Exibida no QR)' : 'Não'} /> </div> );
      break;
    case 'E-mail':
      detailContent = ( <div className="detail-group"> <Title text="Dados do E-mail" /> <DetailItem label="Para" value={details.to || 'N/A'} /> <DetailItem label="Assunto" value={details.subject || 'Sem Assunto'} /> <DetailItem label="Corpo" value={details.body ? details.body.substring(0, 50) + (details.body.length > 50 ? '...' : '') : 'Sem Corpo'} /> </div> );
      break;
    case 'Link':
      detailContent = ( <div className="detail-group"> <Title text="Link URL" /> <DetailItem label="URL Completa" value={details.url} /> </div> );
      break;
    case 'Texto':
      detailContent = ( <div className="detail-group"> <Title text="Conteúdo de Texto" /> <DetailItem label="Texto" value={details.text} /> </div> );
      break;
    default:
      detailContent = <p>Conteúdo não reconhecido.</p>;
  }

  return ( <div className="content-details-box"> <p className="type-badge">Tipo: {type}</p> {detailContent} </div> );
};

export default function QrCodePage() {
  const router = useRouter();
  const { encodedUrl } = router.query; 
  const [decodedContent, setDecodedContent] = useState('');
  
  const ref = useRef(null);
  const [qrInstance, setQrInstance] = useState(null);

  const [logo, setLogo] = useState(null);
  const [dotsColor, setDotsColor] = useState('#000000'); 
  const [bgColor, setBgColor] = useState('#ffffff'); 
  const [dotsStyle, setDotsStyle] = useState('square'); 
  const [cornerStyle, setCornerStyle] = useState('square'); 
  
  const [openAccordion, setOpenAccordion] = useState(null); 

  const handleAccordion = (id) => {
    setOpenAccordion(prev => prev === id ? null : id);
  };

  const options = {
    width: 256,
    height: 256,
    type: 'canvas', 
    data: decodedContent,
    image: logo,
    dotsOptions: {
      color: dotsColor,
      type: dotsStyle
    },
    backgroundOptions: {
      color: bgColor,
    },
    cornersSquareOptions: {
      color: dotsColor, 
      type: cornerStyle
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 4,
      imageSize: 0.3,
    },
    qrOptions: {
      errorCorrectionLevel: logo ? 'H' : 'M'
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !qrInstance) {
      const qr = new QRCodeStyling(options);
      setQrInstance(qr);
    }
  }, [qrInstance, options]); 

  useEffect(() => {
    if (encodedUrl) {
      try {
        const content = decodeURIComponent(encodedUrl);
        setDecodedContent(content);
        
        if (qrInstance) {
          if (ref.current) {
            ref.current.innerHTML = '';
            qrInstance.append(ref.current);
          }
          qrInstance.update({ ...options, data: content });
        }
      } catch (e) {
        console.error("URL inválida:", e);
      }
    }
  }, [encodedUrl, qrInstance, options]); 

  const onLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onDownload = (e) => {
    e.preventDefault(); 
    const container = document.getElementById('qr-container-download'); 
    if (!container) return;

    html2canvas(container, {
      backgroundColor: null, 
      useCORS: true 
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'kasper-labs-qrcode.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const StyleSelector = ({ title, options, selectedValue, onSelect }) => (
    <div className="style-group">
      <label>{title}</label>
      <div className="style-chip-selector">
        {options.map((opt) => (
          <button
            key={opt.id}
            className={`style-chip ${selectedValue === opt.id ? 'active' : ''}`}
            onClick={() => onSelect(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container">
      <Head>
        <title>Editor QR | Kasper-Labs</title>
      </Head>

      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>
      
      <div className="main-layout-grid">
        {decodedContent ? (
          <div className="qr-visual-section">
            <div id="qr-container-download" className="qr-container">
              <div ref={ref} />
            </div>
            <ContentDetails content={decodedContent} />
          </div>
        ) : (
          <p>Gerando seu QR Code...</p>
        )}

        <div className="right-column-wrapper"> 
          <div className="personalization-panel">
            <p className="panel-title">Personalizar QR Code</p>

            <details open={openAccordion === 'cores'}>
              <summary onClick={(e) => { e.preventDefault(); handleAccordion('cores'); }}>
                Cores
              </summary>
              <div className="accordion-content">
                <div className="control-group">
                  <div className="control-item">
                    <label htmlFor="dotsColor">Cor (Pontos)</label>
                    <input 
                      id="dotsColor"
                      type="color" 
                      value={dotsColor} 
                      onChange={(e) => setDotsColor(e.target.value)} 
                    />
                  </div>
                  <div className="control-item">
                    <label htmlFor="bgColor">Cor (Fundo)</label>
                    <input 
                      id="bgColor"
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </details>

            <details open={openAccordion === 'pontos'}>
              <summary onClick={(e) => { e.preventDefault(); handleAccordion('pontos'); }}>
                Estilo dos Pontos
              </summary>
              <div className="accordion-content">
                <StyleSelector
                  title=""
                  options={DOT_STYLES}
                  selectedValue={dotsStyle}
                  onSelect={setDotsStyle}
                />
              </div>
            </details>

            <details open={openAccordion === 'cantos'}>
              <summary onClick={(e) => { e.preventDefault(); handleAccordion('cantos'); }}>
                Estilo dos Cantos
              </summary>
              <div className="accordion-content">
                <StyleSelector
                  title=""
                  options={CORNER_STYLES}
                  selectedValue={cornerStyle}
                  onSelect={setCornerStyle}
                />
              </div>
            </details>

            <details open={openAccordion === 'logo'}>
              <summary onClick={(e) => { e.preventDefault(); handleAccordion('logo'); }}>
                Logo (Centro)
              </summary>
              <div className="accordion-content">
                <div className="control-group">
                  <div className="control-item file-upload">
                    <label htmlFor="logoUpload" className="file-label">
                      {logo ? 'Logo Carregada' : 'Enviar Logo (PNG/JPG)'}
                    </label>
                    <input 
                      id="logoUpload"
                      type="file" 
                      accept="image/png, image/jpeg"
                      onChange={onLogoUpload} 
                    />
                  </div>
                  {logo && (
                    <button onClick={() => setLogo(null)} className="style-chip active" style={{borderColor: '#ff453a', color: '#ff453a', background: '#000'}}>
                      Remover Logo
                    </button>
                  )}
                </div>
              </div>
            </details>

          </div>

          <div className="action-buttons">
            <button onClick={onDownload} className="submit-button download-btn">
              Baixar QR Code (PNG)
            </button>
            <a href="/" className="submit-button" style={{ minWidth: '200px' }}>
              Gerar outro QR Code
            </a>
          </div>
        </div>
      </div>

      <p className="mode-toggle-link">
        Para uma visualização limpa, acesse o <a href={`/${encodedUrl}`}>modo simplificado</a>.
      </p>

    </div>
  );
}