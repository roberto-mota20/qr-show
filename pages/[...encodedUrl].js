import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link'; // Import Link
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
        
        if (rawArray.length > 1) {
          let reconstructed = rawArray.join('/');
          reconstructed = reconstructed.replace(/^(https?):\/([^\/])/, '$1://$2');
          
          router.replace(`/${encodeURIComponent(reconstructed)}`);
          return;
        }

        let rawContent = rawArray[0]; 
        const content = decodeURIComponent(rawContent);

        setDecodedContent(content);
        if (qrInstance) qrInstance.update({ data: content });

      } catch (e) {
        console.error("Erro ao processar URL:", e);
        setDecodedContent("URL inválida.");
      }
    }
  }, [encodedUrl, qrInstance, router]);

  return (
    <div className="container">
      <Head>
        <title>QR Code | Kasper-Labs</title>
      </Head>

      {/* Logo linkada para a Home */}
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
            {decodedContent}
        </div>
      </div>
      
      <p className="mode-toggle-link">
        Você está no modo simplificado. Para editar, acesse o <a href={`/full/${encodeURIComponent(decodedContent)}`}>modo completo</a>.
      </p>
    </div>
  );
}