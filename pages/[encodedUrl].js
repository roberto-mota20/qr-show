import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useMemo } from 'react';
import Head from 'next/head';
import QRCodeStyling from 'qr-code-styling';
import html2canvas from 'html2canvas';

// Tipos de estilos disponíveis para preview
const DOT_STYLES = ['rounded', 'dots', 'classy', 'classy-rounded', 'square', 'extra-rounded'];
const CORNER_STYLES = ['rounded', 'square', 'dot'];

// Componente de Análise de Conteúdo (Parse) - Sem mudanças
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

// Componente de Detalhes do Conteúdo - Sem mudanças
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
  
  const ref = useRef(null);
  const [qrInstance, setQrInstance] = useState(null);

  // --- Estados de Personalização ---
  const [logo, setLogo] = useState(null);
  const [dotsColor, setDotsColor] = useState('#007aff'); // CORREÇÃO: Azul Padrão
  const [bgColor, setBgColor] = useState('#ffffff'); 
  const [dotsStyle, setDotsStyle] = useState('square'); // CORREÇÃO: Quadrado Padrão
  const [cornerStyle, setCornerStyle] = useState('square'); // CORREÇÃO: Quadrado Padrão

  // Memoiza as opções de QR Code para garantir que o objeto seja estável
  const options = useMemo(() => ({
    width: 256,
    height: 256,
    type: 'canvas', 
    data: decodedContent,
    image: logo,
    dotsOptions: { color: dotsColor, type: dotsStyle },
    backgroundOptions: { color: bgColor },
    cornersSquareOptions: { color: dotsColor, type: cornerStyle },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 4,
      imageSize: 0.3,
    },
    qrOptions: {
      errorCorrectionLevel: logo ? 'H' : 'M', // Aumenta a correção se houver logo
    }
  }), [decodedContent, logo, dotsColor, bgColor, dotsStyle, cornerStyle]);

  // 1. Inicializa a instância do QR Code
  useEffect(() => {
    // CORREÇÃO CRÍTICA: O Next.js renderiza o módulo no servidor antes do 'window' existir.
    // Inicializamos a instância apenas no lado do cliente (browser).
    if (typeof window !== 'undefined' && !qrInstance) {
      const qr = new QRCodeStyling(options);
      setQrInstance(qr);
    }
  }, [qrInstance, options]); 

  // 2. Anexa o QR Code ao DOM e atualiza quando as opções ou conteúdo mudam
  useEffect(() => {
    if (encodedUrl && qrInstance) {
        try {
            const content = decodeURIComponent(encodedUrl);
            setDecodedContent(content);
            
            // Atualiza o QR Code com as opções mais recentes
            qrInstance.update(options);

            if (ref.current) {
                // Anexa o QR Code ao DOM se ainda não tiver sido anexado
                if (ref.current.children.length === 0) {
                    qrInstance.append(ref.current);
                }
            }
        } catch (e) {
            console.error("URL inválida:", e);
        }
    }
  }, [encodedUrl, qrInstance, options]);


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

  const onDownload = () => {
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

  // --- Componente de Preview ---
  const StylePreview = ({ type, style, currentStyle, onClick }) => {
    const previewRef = useRef(null);

    // Inicializa e desenha o preview
    useEffect(() => {
      if (previewRef.current) {
        // Opções mínimas para o preview
        const previewOptions = {
          width: 50,
          height: 50,
          type: 'svg',
          data: "https://kasper-labs.com", // Dados de teste
          dotsOptions: { 
            color: '#007aff', 
            type: type === 'dots' ? style : 'square' // Pega o estilo de pontos
          },
          cornersSquareOptions: {
            color: '#007aff',
            type: type === 'corners' ? style : 'square' // Pega o estilo de cantos
          },
          backgroundOptions: { color: '#ffffff' },
          imageOptions: { margin: 0 }
        };
        
        // Se já tiver um preview, apenas atualiza
        if (previewRef.current.children.length > 0) {
            // Se o estilo de preview for de cantos, garantimos que os pontos sejam quadrados
            if (type === 'corners') previewOptions.dotsOptions.type = 'square';
            
            // Cria uma nova instância para desenhar no DOM
            const qr = new QRCodeStyling(previewOptions);
            qr.append(previewRef.current);
        } else {
             const qr = new QRCodeStyling(previewOptions);
             qr.append(previewRef.current);
        }
      }
    }, [style, type]);
    
    // CORREÇÃO: Usamos o useEffect para garantir que o preview seja desenhado
    // Usamos um novo componente para garantir o ciclo de vida
    return (
        <button 
            className={`style-preview-button ${style === currentStyle ? 'active' : ''}`}
            onClick={onClick}
        >
            <div ref={previewRef} className="style-preview-canvas" />
        </button>
    )
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

        {/* --- SELETOR DE ESTILO (PREVIEWS) --- */}
        <h3 className="panel-title" style={{marginTop: '1.5rem'}}>Estilo dos Pontos</h3>
        <div className="style-selector-grid">
            {DOT_STYLES.map(style => (
                <StylePreview 
                    key={style}
                    type="dots"
                    style={style}
                    currentStyle={dotsStyle}
                    onClick={() => setDotsStyle(style)}
                />
            ))}
        </div>
        
        <h3 className="panel-title" style={{marginTop: '1.5rem'}}>Estilo dos Cantos</h3>
        <div className="style-selector-grid">
            {CORNER_STYLES.map(style => (
                <StylePreview 
                    key={style}
                    type="corners"
                    style={style}
                    currentStyle={cornerStyle}
                    onClick={() => setCornerStyle(style)}
                />
            ))}
        </div>

        {/* Upload de Logo */}
        <h3 className="panel-title" style={{marginTop: '1.5rem'}}>Logo (Aumenta a Correção de Erro)</h3>
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