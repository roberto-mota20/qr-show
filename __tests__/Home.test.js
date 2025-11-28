import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../pages/index';

// --- MOCK DO ROUTER (Simulamos o Next.js Router) ---
const pushMock = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: pushMock,
    route: '/',
    pathname: '',
    query: '',
    asPath: '',
  }),
}));

// Mock do módulo de países para garantir dados previsíveis
jest.mock('../utils/countries', () => ({
  countries: [
    { name: "Brasil", code: "55" },
    { name: "Estados Unidos", code: "1" }
  ]
}));

describe('Página Inicial (Gerador de QR Code)', () => {
  
  beforeEach(() => {
    pushMock.mockClear(); // Limpa o histórico do roteador
    window.localStorage.clear(); // Limpa o histórico local simulado
    jest.clearAllMocks();
  });

  // --- TESTES GERAIS ---
  it('deve renderizar todos os botões de modo', () => {
    render(<Home explainerContent="Conteúdo de teste" />);
    
    expect(screen.getByText(/kasper-/i)).toBeInTheDocument();
    
    // Verifica a presença dos botões principais
    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
    expect(screen.getByText('vCard')).toBeInTheDocument();
    expect(screen.getByText('Pix')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
  });

  // --- TESTES DE LINK ---
  it('Modo Link: deve corrigir URL incompleta', async () => {
    render(<Home explainerContent="" />);
    const user = userEvent.setup();

    // Digita "google" (Link é o padrão)
    const input = screen.getByPlaceholderText(/URL \(ex: kasper-labs.com\)/i);
    await user.type(input, 'google');

    // Gera
    const button = screen.getByText('Criar QR Code (Personalizável)');
    await user.click(button);

    // Espera redirecionamento para https://google.com
    const expected = encodeURIComponent('https://google.com');
    expect(pushMock).toHaveBeenCalledWith(`/full/${expected}`);
  });

  // --- TESTES DE WHATSAPP ---
  it('Modo WhatsApp: deve detectar número curto e abrir modal de país', async () => {
    render(<Home explainerContent="" />);
    const user = userEvent.setup();

    // Muda para aba WhatsApp
    await user.click(screen.getByText('WhatsApp'));

    // Digita número sem DDI (11 dígitos = Celular BR com DDD)
    const input = screen.getByPlaceholderText(/WhatsApp com DDD e DDI/i);
    await user.type(input, '11999998888');

    // Tenta gerar
    await user.click(screen.getByText('Criar QR Code (Rápido)'));

    // O modal deve aparecer
    expect(screen.getByText(/Faltou o Código do País\?/i)).toBeInTheDocument();

    // CORREÇÃO: Seleciona Brasil pelo nome (o código +55 está em outro elemento visual agora)
    const brBtn = screen.getByText('Brasil');
    await user.click(brBtn);

    // Deve redirecionar com o número corrigido (55 + 11999998888)
    const expectedPhone = '5511999998888';
    // O link gerado será https://wa.me/5511999998888?text=
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining(expectedPhone));
  });

  // --- TESTES DE PIX ---
  it('Modo Pix: deve validar campos obrigatórios na aba Manual', async () => {
    render(<Home explainerContent="" />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Pix'));
    await user.click(screen.getByText('Manual')); // Garante aba manual

    // Tenta gerar vazio
    await user.click(screen.getByText('Criar QR Code (Personalizável)'));

    // Erro esperado
    expect(screen.getByText(/preencha as informações obrigatórias/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Modo Pix: deve salvar no histórico ao gerar', async () => {
    render(<Home explainerContent="" />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Pix'));
    await user.click(screen.getByText('Manual'));

    // Preenche dados
    await user.type(screen.getByPlaceholderText(/Chave Pix/i), '123456');
    await user.type(screen.getByPlaceholderText(/Nome do Beneficiário/i), 'Kasper Teste');
    await user.type(screen.getByPlaceholderText(/Cidade do Beneficiário/i), 'SP');

    await user.click(screen.getByText('Criar QR Code (Rápido)'));

    // Verifica localStorage
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'kasper_pix_history',
      expect.stringContaining('Kasper Teste')
    );
    expect(pushMock).toHaveBeenCalled();
  });

  // --- TESTES DE VCARD ---
  it('Modo vCard: deve gerar vCard corretamente', async () => {
    render(<Home explainerContent="" />);
    const user = userEvent.setup();

    await user.click(screen.getByText('vCard'));

    await user.type(screen.getByPlaceholderText('Nome'), 'João');
    await user.type(screen.getByPlaceholderText(/Telefone/i), '99998888');

    await user.click(screen.getByText('Criar QR Code (Personalizável)'));

    // O payload deve conter BEGIN:VCARD e os dados
    const callArgs = pushMock.mock.calls[0][0];
    const decoded = decodeURIComponent(callArgs);
    
    expect(decoded).toContain('BEGIN:VCARD');
    expect(decoded).toContain('FN:João');
    expect(decoded).toContain('TEL;TYPE=CELL:99998888');
  });

  // --- TESTES DE BITCOIN ---
  it('Modo Bitcoin: deve validar endereço curto', async () => {
    render(<Home explainerContent="" />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Bitcoin'));

    // Digita endereço inválido (curto)
    const input = screen.getByPlaceholderText(/Endereço da Carteira/i);
    await user.type(input, '123'); // Muito curto

    await user.click(screen.getByText('Criar QR Code (Rápido)'));

    expect(screen.getByText(/endereço parece muito curto/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

});