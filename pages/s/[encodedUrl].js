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
    type: 'square' // CORREÇÃO: Quadrado
  },
  backgroundOptions: {
    color: '#ffffff', // Branco Puro
  },
  cornersSquareOptions: {
    color: '#000000',
    type: 'square' // CORREÇÃO: Quadrado
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 4 // CORREÇÃO: Adiciona uma pequena margem interna
  }
};

export default function SimpleQrCodePage() {
  const router = useRouter();
  const { encodedUrl } = router.query;
  const [decodedContent, setDecodedContent] = useState('');
  const [qrInstance, setQrInstance] = useState(null);
  const ref = useRef(null); // Ref para o contêiner do QR Code

  useEffect(() => {
    // Inicializa a instância do QR Code Styling
    if (typeof window !== 'undefined' && !qrInstance) {
      const qr = new QRCodeStyling(qrOptions);
      setQrInstance(qr);
    }
  }, [qrInstance]);

  useEffect(() => {
    // Anexa o QR Code ao DOM
    if (qrInstance && ref.current) {
        // Limpa o contêiner antes de anexar
        ref.current.innerHTML = '';
        qrInstance.append(ref.current);
    }
  }, [qrInstance]);

  useEffect(() => {
    // Atualiza o QR Code quando a URL mudar
    if (encodedUrl && qrInstance) {
      try {
        const content = decodeURIComponent(encodedUrl);
        setDecodedContent(content);
        qrInstance.update({ data: content });
      } catch (e) {
        console.error("URL inválida:", e);
        setDecodedContent("URL inválida ou malformada.");
      }
    }
  }, [encodedUrl, qrInstance]);

  return (
    <div className="container simple-mode">
      <Head>
        <title>Gerador Qr | Kasper-Labs</title>
      </Head>

      {/* CORREÇÃO: Logo responsiva (classe do globals.css) */}
      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>
      
      {/* O QR Code será montado aqui */}
      <div className="qr-container-simple">
        <div ref={ref} />
        {/* Payload que ficará SOBRE a área branca (estilizado no CSS) */}
        <div className="simple-payload">
            {decodedContent}
        </div>
      </div>
      
    </div>
  );
}