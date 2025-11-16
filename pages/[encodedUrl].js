import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import QRCode from 'qrcode'; // Biblioteca que gera o QR

// Função para analisar o conteúdo do QR Code e extrair os dados específicos
const parseQrContent = (content) => {
  if (content.startsWith('WIFI:')) {
    // Parser para Wi-Fi: WIFI:T:<SECURITY>;S:<SSID>;P:<PASSWORD>;;
    const data = {};
    // Pega a string após 'WIFI:' e remove o ';;' final
    const parts = content.substring(5).slice(0, -2).split(';').map(p => p.trim());
    
    parts.forEach(part => {
      if (part.startsWith('T:')) data.security = part.substring(2);
      if (part.startsWith('S:')) data.ssid = part.substring(2);
      if (part.startsWith('P:')) data.password = part.substring(2);
    });

    return { type: 'Wi-Fi', details: data };
  } else if (content.startsWith('mailto:')) {
    // Parser para E-mail: mailto:<email>?subject=<assunto>&body=<body>
    const [recipientPart, queryPart] = content.substring(7).split('?');
    const data = { to: recipientPart };

    if (queryPart) {
      // Uso de URLSearchParams para decodificar os parâmetros
      const params = new URLSearchParams(queryPart);
      data.subject = params.get('subject') ? decodeURIComponent(params.get('subject')) : '';
      data.body = params.get('body') ? decodeURIComponent(params.get('body')) : '';
    }
    
    return { type: 'E-mail', details: data };
  } else if (content.startsWith('http://') || content.startsWith('https://')) {
    return { type: 'Link', details: { url: content } };
  } else {
    // Trata como texto simples
    return { type: 'Texto', details: { text: content } };
  }
};

// Componente para exibir os detalhes formatados
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
      detailContent = (
        <div className="detail-group">
          <Title text="Dados da Rede Wi-Fi" />
          <DetailItem label="SSID (Rede)" value={details.ssid || 'N/A'} />
          <DetailItem label="Segurança" value={details.security || 'N/A'} />
          <DetailItem label="Senha" value={details.password ? 'Sim (Exibida no QR)' : 'Não'} />
        </div>
      );
      break;
    case 'E-mail':
      detailContent = (
        <div className="detail-group">
          <Title text="Dados do E-mail" />
          <DetailItem label="Para" value={details.to || 'N/A'} />
          <DetailItem label="Assunto" value={details.subject || 'Sem Assunto'} />
          {/* Mostra um trecho do corpo se existir */}
          <DetailItem 
            label="Corpo" 
            value={details.body ? details.body.substring(0, 50) + (details.body.length > 50 ? '...' : '') : 'Sem Corpo'} 
          />
        </div>
      );
      break;
    case 'Link':
      detailContent = (
        <div className="detail-group">
          <Title text="Link URL" />
          <DetailItem label="URL Completa" value={details.url} />
        </div>
      );
      break;
    case 'Texto':
      detailContent = (
        <div className="detail-group">
          <Title text="Conteúdo de Texto" />
          <DetailItem label="Texto" value={details.text} />
        </div>
      );
      break;
    default:
      detailContent = <p>Conteúdo não reconhecido.</p>;
  }

  return (
    <div className="content-details-box">
      <p className="type-badge">Tipo: {type}</p>
      {detailContent}
    </div>
  );
};


export default function QrCodePage() {
  const router = useRouter();
  const { encodedUrl } = router.query; 
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [decodedContent, setDecodedContent] = useState('');

  useEffect(() => {
    if (encodedUrl) {
      try {
        const content = decodeURIComponent(encodedUrl);
        setDecodedContent(content);

        // Gera o QR Code como um Data URL (uma imagem em base64)
        QRCode.toDataURL(content, { width: 256, margin: 2 }, (err, dataUrl) => {
          if (err) {
            console.error("Erro ao gerar QR Code:", err);
            return;
          }
          setQrCodeDataUrl(dataUrl);
        });
      } catch (e) {
        console.error("URL inválida:", e);
      }
    }
  }, [encodedUrl]); 

  return (
    <div className="container">
      <Head>
        <title>Seu QR Code</title>
      </Head>

      <h1 className="kasper-logo" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>
      
      {qrCodeDataUrl ? (
        <div className="qr-visual-section">
          <div className="qr-container">
            {/* Exibe a imagem do QR Code */}
            <img src={qrCodeDataUrl} alt="QR Code" width={256} height={256} />
          </div>

          {/* Componente para exibir os detalhes do conteúdo */}
          <ContentDetails content={decodedContent} />
        </div>
      ) : (
        <p>Gerando seu QR Code...</p>
      )}

      {/* Botão para voltar à página inicial, usando o estilo submit-button */}
      <div style={{ marginTop: '2rem' }}>
        <a href="/" className="submit-button" style={{ minWidth: '200px' }}>Gerar outro QR Code</a>
      </div>
    </div>
  );
}