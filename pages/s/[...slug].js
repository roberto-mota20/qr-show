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
    margin: 4 // Adiciona uma pequena margem interna
  }
};

export default function SimpleQrCodePage() {
  const router = useRouter();
  const { slug } = router.query; // CORREÇÃO 404: Usa o 'slug'
  
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
    // CORREÇÃO 404: Atualiza o QR Code quando a URL mudar
    if (slug && qrInstance) {
      try {
        // Junta as partes do slug (ex: ['https:', 'google.com'] => 'https:/google.com')
        const content = Array.isArray(slug) ? slug.join('/') : slug;
        setDecodedContent(content);
        qrInstance.update({ data: content });
      } catch (e) {
        console.error("URL inválida:", e);
        setDecodedContent("URL inválida ou malformada.");
      }
    }
  }, [slug, qrInstance]);

  return (
    <div className="container">
      <Head>
        <title>Gerador Qr | Kasper-Labs</title>
      </Head>

      {/* Logo responsiva (classe do globals.css) */}
      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>
      
      {/* Layout "Quadrado Estendido" */}
      <div className="qr-container-simple">
        <div className="qr-square-part">
          <div ref={ref} />
        </div>
        <div className="simple-payload">
            {decodedContent}
        </div>
      </div>
      
      {/* NOVO: Link para o Modo Completo (usa a URL decodificada) */}
      <p className="mode-toggle-link">
        Você está no modo simplificado. Para editar, acesse o <a href={`/${decodedContent}`}>modo completo</a>.
      </p>
    </div>
  );
}