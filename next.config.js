/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuração de Headers de Segurança HTTP
  async headers() {
    return [
      {
        // Aplica essas regras para TODAS as rotas
        source: '/:path*',
        headers: [
          {
            // Protege contra Clickjacking (impede que seu site abra em iframes de outros sites)
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Evita que o navegador "adivinhe" tipos de arquivo incorretos (risco de segurança)
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Força o uso de HTTPS (HSTS)
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Proteção básica contra XSS em navegadores antigos
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Controla quanta informação de referência é enviada ao clicar em links externos
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;