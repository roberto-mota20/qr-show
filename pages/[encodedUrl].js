import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import QRCodeStyling from 'qr-code-styling'; // CORRIGIDO
import html2canvas from 'html2canvas';

// Componente de Análise de Conteúdo (Parse)
const parseQrContent = (content) => {
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


// --- PÁGINA PRINCIPAL DO QR CODE ---
export default function QrCodePage() {
  const router = useRouter();
  const { encodedUrl } = router.query;
  const [decodedContent, setDecodedContent] = useState('');
  
  // Ref para o contêiner do QR Code
  const ref = useRef(null);
  // Instância do QR Code
  const [qrInstance, setQrInstance] = useState(null);

  // --- Estados de Personalização ---
  const [logo, setLogo] = useState(null);
  const [dotsColor, setDotsColor] = useState('#000000'); // Preto Puro
  const [bgColor, setBgColor] = useState('#ffffff'); // Branco Puro
  const [dotsStyle, setDotsStyle] = useState('rounded');
  const [cornerStyle, setCornerStyle] = useState('rounded');

  // Opções Iniciais do QR Code
  const initialOptions = {
    width: 256,
    height: 256,
    type: 'canvas', // Canvas é melhor para download e logo
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
      color: dotsColor, // Cor dos cantos segue a cor dos pontos
      type: cornerStyle
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 4,
      // Aumenta a correção de erro se houver logo
      imageSize: 0.3,
    },
    qrOptions: {
      errorCorrectionLevel: 'M', // Padrão
    }
  };

  // 1. Inicializa a instância do QR Code
  useEffect(() => {
    if (typeof window !== 'undefined' && !qrInstance) {
      const qr = new QRCodeStyling(initialOptions);
      setQrInstance(qr);
    }
  }, []); // Executa apenas uma vez

  // 2. Anexa o QR Code ao DOM quando a instância estiver pronta
  useEffect(() => {
    if (qrInstance && ref.current) {
      // Limpa o contêiner antes de anexar
      ref.current.innerHTML = '';
      qrInstance.append(ref.current);
    }
  }, [qrInstance]);

  // 3. Atualiza o conteúdo (data) do QR Code quando a URL mudar
  useEffect(() => {
    if (encodedUrl) {
      try {
        const content = decodeURIComponent(encodedUrl);
        setDecodedContent(content);
        if (qrInstance) {
          qrInstance.update({ data: content });
        }
      } catch (e) {
        console.error("URL inválida:", e);
      }
    }
  }, [encodedUrl, qrInstance]);

  // 4. Observador para ATUALIZAR o QR Code quando a personalização mudar
  useEffect(() => {
    if (!qrInstance) return;

    qrInstance.update({
      dotsOptions: { color: dotsColor, type: dotsStyle },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { color: dotsColor, type: cornerStyle },
      image: logo,
      qrOptions: {
        // Aumenta a correção de erro para 'H' (High) se houver um logo
        errorCorrectionLevel: logo ? 'H' : 'M'
      }
    });
  }, [logo, dotsColor, bgColor, dotsStyle, cornerStyle, qrInstance]);

  // --- Funções de Manipulação ---

  const onLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Função de Download (com padding)
  const onDownload = () => {
    const container = document.getElementById('qr-container-download'); // O contêiner com padding
    if (!container) return;

    html2canvas(container, {
      backgroundColor: null, // Mantém fundo transparente se houver
      useCORS: true // Para a logo
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'kasper-labs-qrcode.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div className="container">
      <Head>
        <title>Gerador Qr | Kasper-Labs</title>
      </Head>

      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>
      
      {decodedContent ? (
        <div className="qr-visual-section">
          
          {/* O QR Code será montado aqui */}
          <div id="qr-container-download" className="qr-container">
            <div ref={ref} />
          </div>

          {/* Componente para exibir os detalhes do conteúdo */}
          <ContentDetails content={decodedContent} />
        </div>
      ) : (
        <p>Gerando seu QR Code...</p>
      )}

      {/* --- PAINEL DE PERSONALIZAÇÃO --- */}
      <div className="personalization-panel">
        <h3 className="panel-title">Personalizar QR Code</h3>
        
        {/* Controles de Cor */}
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

        {/* Controles de Estilo */}
        <div className="control-group">
          <div className="control-item">
            <label htmlFor="dotsStyle">Estilo (Pontos)</label>
            <select id="dotsStyle" value={dotsStyle} onChange={(e) => setDotsStyle(e.target.value)}>
              <option value="rounded">Redondo</option>
              <option value="dots">Pontos</option>
              <option value="classy">Elegante</option>
              <option value="classy-rounded">Elegante (Curvo)</option>
              <option value="square">Quadrado</option>
              <option value="extra-rounded">Extra Curvo</option>
            </select>
          </div>
          <div className="control-item">
            <label htmlFor="cornerStyle">Estilo (Cantos)</label>
            <select id="cornerStyle" value={cornerStyle} onChange={(e) => setCornerStyle(e.target.value)}>
              <option value="rounded">Redondo</option>
              <option value="square">Quadrado</option>
              <option value="dot">Ponto</option>
            </select>
          </div>
        </div>

        {/* Upload de Logo */}
        <div className="control-group">
          <div className="control-item file-upload">
            <label htmlFor="logoUpload" className="file-label">
              {logo ? 'Logo Carregada' : 'Enviar Logo (Centro)'}
            </label>
            <input 
              id="logoUpload"
              type="file" 
              accept="image/png, image/jpeg"
              onChange={onLogoUpload} 
            />
          </div>
          {logo && (
            <button onClick={() => setLogo(null)} className="remove-logo-btn">
              Remover Logo
            </button>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="action-buttons">
        <button onClick={onDownload} className="submit-button download-btn">
          Baixar QR Code (PNG)
        </button>
        <a href="/" className="submit-button" style={{ minWidth: '200px' }}>
          Gerar outro QR Code
        </a>
      </div>
    </div>
  );
}