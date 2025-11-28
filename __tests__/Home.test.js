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

describe('Página Inicial (Gerador de QR Code)', () => {
  
  beforeEach(() => {
    pushMock.mockClear(); // Limpa o histórico do roteador antes de cada teste
    window.localStorage.clear(); // Limpa o histórico local simulado
  });

  it('deve renderizar o título e os botões de modo corretamente', () => {
    render(<Home />);
    
    // Verifica se a logo está na tela
    expect(screen.getByText(/kasper-/i)).toBeInTheDocument();
    expect(screen.getByText(/labs/i)).toBeInTheDocument();

    // Verifica se os botões de modo existem
    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
    expect(screen.getByText('Pix')).toBeInTheDocument();
  });

  it('Modo Link: deve corrigir URL incompleta e redirecionar corretamente', async () => {
    render(<Home />);
    const user = userEvent.setup();

    // 1. O modo Link é o padrão. Digita "google" no input
    const input = screen.getByPlaceholderText(/URL \(ex: kasper-labs.com\)/i);
    await user.type(input, 'google');

    // 2. Clica em "Criar QR Code (Personalizável)"
    const button = screen.getByText('Criar QR Code (Personalizável)');
    await user.click(button);

    // 3. Verifica se redirecionou para a URL corrigida (https://google.com)
    // A URL esperada é /full/https%3A%2F%2Fgoogle.com
    const expectedUrl = 'https://google.com';
    const encoded = encodeURIComponent(expectedUrl);
    
    expect(pushMock).toHaveBeenCalledWith(`/full/${encoded}`);
  });

  it('Modo Link: deve mostrar erro se tentar gerar vazio', async () => {
    render(<Home />);
    const user = userEvent.setup();

    // Clica sem digitar nada
    const button = screen.getByText('Criar QR Code (Personalizável)');
    await user.click(button);

    // Verifica se a mensagem de erro apareceu
    expect(screen.getByText(/preencha a URL/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Modo Pix: deve permitir preenchimento manual e salvar no histórico', async () => {
    render(<Home />);
    const user = userEvent.setup();

    // 1. Muda para a aba Pix
    const pixTab = screen.getByText('Pix');
    await user.click(pixTab);

    // 2. Muda para o modo Manual (o padrão é Importar ou Manual dependendo do estado inicial, garantimos clicando)
    const manualBtn = screen.getByText('Manual');
    await user.click(manualBtn);

    // 3. Preenche os campos obrigatórios
    const keyInput = screen.getByPlaceholderText(/Chave Pix/i);
    const nameInput = screen.getByPlaceholderText(/Nome do Beneficiário/i);
    const cityInput = screen.getByPlaceholderText(/Cidade do Beneficiário/i);

    await user.type(keyInput, '12345678900'); // CPF fictício
    await user.type(nameInput, 'Fulano Teste');
    await user.type(cityInput, 'Sao Paulo');

    // 4. Gera o QR Code
    const generateBtn = screen.getByText('Criar QR Code (Rápido)');
    await user.click(generateBtn);

    // 5. Verifica se o router foi chamado (significa que passou na validação e gerou o payload)
    expect(pushMock).toHaveBeenCalled();

    // 6. Verifica se salvou no localStorage
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'kasper_pix_history', 
      expect.stringContaining('Fulano Teste')
    );
  });
});