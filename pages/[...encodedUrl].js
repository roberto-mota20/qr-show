import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import QRCodeStyling from 'qr-code-styling';

const qrOptions = {
  width: 256,
  height: 256,
  type: 'svg',
  dotsOptions: { color: '#000000', type: 'square' },
  backgroundOptions: { color: '#ffffff' },
  cornersSquareOptions: { color: '#000000', type: 'square' },
  imageOptions: { crossOrigin: 'anonymous', margin: 4 }
};

const MAX_LENGTH = 2048; 

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
    if (encodedUrl) {
      try {
        const rawArray = Array.isArray(encodedUrl) ? encodedUrl : [encodedUrl];
        let rawContent = rawArray.join('/');

        // Validação de tamanho bruto
        if (rawContent.length > MAX_LENGTH) {
            router.replace('/404');
            return;
        }
        
        // Correção de protocolo (https:/ -> https://) e redirecionamento para URL "bonita"
        if (rawArray.length > 1) {
          let reconstructed = rawArray.join('/');
          reconstructed = reconstructed.replace(/^(https?):\/([^\/])/, '$1://$2');
          
          router.replace(`/${encodeURIComponent(reconstructed)}`);
          return;
        }

        const content = decodeURIComponent(rawArray[0]);

        // Validação final de tamanho
        if (content.length > MAX_LENGTH) {
            router.replace('/404');
            return;
        }

        setDecodedContent(content);
        if (qrInstance) qrInstance.update({ data: content });

      } catch (e) {
        console.error("Erro ao processar URL:", e);
        setDecodedContent("URL inválida.");
      }
    }
  }, [encodedUrl, qrInstance, router]);

  // Título da página limpo
  const pageTitle = decodedContent 
    ? `qr.kasper-labs.com | ${decodedContent.substring(0, 30)}${decodedContent.length > 30 ? '...' : ''}`
    : 'QR Code | Kasper-Labs';

  return (
    <div className="container">
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <Link href="/" style={{ textDecoration: 'none' }}>
        <h1 className="kasper-logo" style={{ cursor: 'pointer' }}>
          &lt;/kasper-<span className="blue-text">labs</span>&gt;
        </h1>
      </Link>
      
      <div className="qr-container-simple">
        <div className="qr-square-part">
          <div ref={ref} />
        </div>
        <div className="simple-payload">
            {/* Visualização limpa: apenas o conteúdo */}
            {decodedContent}
        </div>
      </div>
      
      <p className="mode-toggle-link">
        Você está no modo simplificado. Para editar, acesse o <a href={`/full/${encodeURIComponent(decodedContent)}`}>modo completo</a>.
      </p>
    </div>
  );
}