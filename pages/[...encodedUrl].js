import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
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
        // 1. Pega o conteúdo (se for array, junta com barras)
        const rawArray = Array.isArray(encodedUrl) ? encodedUrl : [encodedUrl];
        
        // Se o array tiver mais de 1 item, significa que a URL não estava codificada (tem barras nela)
        // Então vamos redirecionar para a versão codificada para ficar igual à Home.
        if (rawArray.length > 1) {
          let reconstructed = rawArray.join('/');
          // Corrige protocolo quebrado pelo navegador (https:/ -> https://)
          reconstructed = reconstructed.replace(/^(https?):\/([^\/])/, '$1://$2');
          
          // Redireciona para a URL codificada correta
          router.replace(`/${encodeURIComponent(reconstructed)}`);
          return;
        }

        // Se chegou aqui, é porque já está codificado ou é simples. Decodifica e gera.
        let rawContent = rawArray[0]; 
        // Decodifica apenas se necessário (Next.js as vezes já entrega decodificado parte do caminho)
        // Mas como estamos garantindo o encode no redirect acima, aqui garantimos o decode.
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
      
      <p className="mode-toggle-link">
        Você está no modo simplificado. Para editar, acesse o <a href={`/full/${encodeURIComponent(decodedContent)}`}>modo completo</a>.
      </p>
    </div>
  );
}