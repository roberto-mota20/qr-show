import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <div className="container" style={{ 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <Head>
        <title>404 | Kasper-Labs</title>
      </Head>

      {/* Logo linkada para a Home */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <h1 className="kasper-logo" style={{ cursor: 'pointer', marginBottom: '1rem' }}>
          &lt;/kasper-<span className="blue-text">labs</span>&gt;
        </h1>
      </Link>

      <h2 style={{ 
        fontFamily: "'Lexend', sans-serif", 
        fontSize: '4rem', 
        color: '#007aff', 
        margin: '0 0 1rem 0',
        fontWeight: 900
      }}>
        404
      </h2>

      <h3 style={{ 
        fontFamily: "'Roboto Mono', monospace", 
        fontSize: '1.2rem', 
        marginBottom: '1.5rem' 
      }}>
        Ops! Página não encontrada.
      </h3>

      <p style={{ 
        maxWidth: '600px', 
        marginBottom: '3rem', 
        color: '#cccccc', 
        lineHeight: '1.6',
        fontSize: '0.9rem'
      }}>
        Parece que você acessou uma dimensão vazia. Como nosso sistema transforma quase qualquer link em um QR Code, você provavelmente tentou acessar a área de edição sem um link (como <code>/full</code>).
      </p>

      {/* Botão reutilizando a classe global */}
      <Link href="/" className="submit-button" style={{ minWidth: '220px' }}>
        Voltar para o Início
      </Link>
    </div>
  );
}