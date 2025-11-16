import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import QRCode from 'qrcode'; // Biblioteca que gera o QR

export default function QrCodePage() {
  const router = useRouter();
  const { encodedUrl } = router.query; // Pega o valor da URL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [decodedUrl, setDecodedUrl] = useState('');

  useEffect(() => {
    // Só executa se 'encodedUrl' já estiver disponível
    if (encodedUrl) {
      try {
        const url = decodeURIComponent(encodedUrl);
        setDecodedUrl(url);

        // Gera o QR Code como um Data URL (uma imagem em base64)
        QRCode.toDataURL(url, { width: 256, margin: 2 }, (err, dataUrl) => {
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
  }, [encodedUrl]); // Re-executa quando 'encodedUrl' mudar

  return (
    <div className="container">
      <Head>
        <title>Seu QR Code</title>
      </Head>

      <h1 className="kasper-logo" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>
      
      {qrCodeDataUrl ? (
        <div className="qr-container">
          {/* Exibe a imagem do QR Code */}
          <img src={qrCodeDataUrl} alt="QR Code" width={256} height={256} />
          
          {/* Exibe o link decodificado abaixo */}
          <span className="qr-link">
            {decodedUrl}
          </span>
        </div>
      ) : (
        <p>Gerando seu QR Code...</p>
      )}

      <div style={{ marginTop: '2rem' }}>
        <a href="/">Gerar outro QR Code</a>
      </div>
    </div>
  );
}