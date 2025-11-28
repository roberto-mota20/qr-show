import { NextResponse } from 'next/server';

export function middleware(request) {
  // Pega o User-Agent (identidade do navegador/robô)
  const userAgent = request.headers.get('user-agent') || '';
  
  // Lista de "Agentes" que geralmente indicam ataques ou scripts automatizados básicos
  // curl/wget: usados para baixar páginas via terminal
  // python/perl: scripts de automação (muitas botnets usam)
  // sqlmap/nmap: ferramentas de hacker para escanear vulnerabilidades
  const blockedAgents = [
    'curl', 
    'wget', 
    'python-requests', 
    'libwww-perl', 
    'sqlmap', 
    'nmap', 
    'nikto',
    'hydra'
  ];

  // Verifica se o visitante está na lista negra (case insensitive)
  const isAttackBot = blockedAgents.some(agent => 
    userAgent.toLowerCase().includes(agent)
  );

  if (isAttackBot) {
    // Retorna 403 Forbidden imediatamente, sem processar o resto do site
    return new NextResponse(
      JSON.stringify({ 
        message: 'Acesso negado pelo Firewall de Segurança da Kasper-Labs.',
        ip: request.ip 
      }),
      { 
        status: 403, 
        headers: { 'content-type': 'application/json' } 
      }
    );
  }

  // Se passou, libera o acesso normalmente
  return NextResponse.next();
}

// Configura o middleware para rodar em todas as rotas
export const config = {
  matcher: '/:path*',
};