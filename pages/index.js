import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return;

    // Nós codificamos a URL para que ela possa ser usada com segurança
    // como um parâmetro na barra de endereços.
    const encodedUrl = encodeURIComponent(url);
    
    // Redireciona o usuário para a página de QR Code
    router.push(`/${encodedUrl}`);
  };

  return (
    <div className="container">
      <Head>
        <title>Kasper-Labs QR</title>
        <meta name="description" content="Gerador de QR Code da Kasper-Labs" />
      </Head>

      {/* Logo da Kasper-Labs */}
      <h1 className="kasper-logo">
        &lt;/kasper-<span className="blue-text">labs</span>&gt;
      </h1>

      {/* Formulário de Input */}
      <form onSubmit={handleSubmit} className="qr-form">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Cole sua URL aqui..."
          className="url-input"
          required
        />
        <button type="submit" className="submit-button">
          Gerar QR Code
        </button>
      </form>
    </div>
  );
}