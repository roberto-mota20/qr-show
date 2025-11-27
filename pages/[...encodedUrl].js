import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import QRCodeStyling from 'qr-code-styling';

// Opções de QR Code para o modo simples (QUADRADÃO)
const qrOptions = {
  width: 256,
  height: 256,
  type: 'svg',
  dotsOptions: {
    color: '#000000', // Preto Puro
    type: 'square' // Padrão Quadrado
  },
  backgroundOptions: {
    color: '#ffffff', // Branco Puro
  },
  cornersSquareOptions: {
    color: '#000000',
    type: 'square' // Padrão Quadrado
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 4 
  }
};

export default function SimpleQrCodePage() {
  const router = useRouter();
  const { encodedUrl } = router.query; 
  
  const [decodedContent, setDecodedContent] = useState('');
  const [qrInstance, setQrInstance] = useState(null);
  const ref = useRef(null); 

  useEffect(() => {
    if (typeof window !== 'undefined' && !qrInstance) {
      const qr = new QRCodeStyling(qrOptions);
      setQrInstance(qr);
    }
  }, [qrInstance]);

  useEffect(() => {
    if (qrInstance && ref.current) {
        ref.current.innerHTML = '';
        qrInstance.append(ref.current);
    }
  }, [qrInstance]);

  useEffect(() => {
    if (encodedUrl &&qrInstance) {
      try {
        // --- CORREÇÃO DE URL ---
        // 1. Garante que é um array e junta com '/' para remover as vírgulas indesejadas
        const rawArray = Array.isArray(encodedUrl) ? encodedUrl : [encodedUrl];
        let rawContent = rawArray.join('/');

        // 2. Corrige o protocolo "https:/" para "https://" (navegadores removem uma barra na URL)
        // Regex: Se começar com http:/ ou https:/ seguido de algo que NÃO seja barra, adiciona a barra extra
        rawContent = rawContent.replace(/^(https?):\/([^\/])/, '$1://$2');

        const content = decodeURIComponent(rawContent);

        setDecodedContent(content);
        qrInstance.update({ data: content });
      } catch (e) {
        console.error("URL inválida:", e);
        setDecodedContent("URL inválida ou malformada.");
      }
    }
  }, [encodedUrl, qrInstance]);

  return (
    <div className="container">
      <Head>
        <title>QR Code | Kasper-Labs</title>
      </Head>

      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>
      
      <div className="qr-container-simple">
        <div className="qr-square-part">
          <div ref={ref} />
        </div>
        <div className="simple-payload">
            {decodedContent}
        </div>
      </div>
      
      {/* Link para o modo completo (agora em /full/) */}
      <p className="mode-toggle-link">
        Você está no modo simplificado. Para editar, acesse o <a href={`/full/${encodeURIComponent(decodedContent)}`}>modo completo</a>.
      </p>
    </div>
  );
}