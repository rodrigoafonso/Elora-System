import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Provedores } from '@/app/providers';
import { rotas } from '@/app/rotas';
import { criarCasaMaisMemoria } from '@/infrastructure/casamais/memoria';
import { montarContainer } from '@/infrastructure/di/container';
import { criarLocacaoMemoria } from '@/infrastructure/locacao/memoria';

const abrir = () => {
  const casaMais = criarCasaMaisMemoria();
  const router = createMemoryRouter(rotas, { initialEntries: ['/posvenda'] });
  render(
    <Provedores container={montarContainer(casaMais, criarLocacaoMemoria())}>
      <RouterProvider router={router} />
    </Provedores>,
  );
};

describe('Elora Casa+ (equipe)', () => {
  it('mostra o menu, os indicadores e os pedidos em aberto', async () => {
    abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Elora Casa+' })).toBeInTheDocument();
    const menu = document.getElementById('nav') as HTMLElement;
    expect(within(menu).getByRole('button', { name: 'Elora Casa+' })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByText('Vazamento embaixo da pia da cozinha')).toBeInTheDocument();
    expect(screen.getByText('Pedidos em aberto').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Mudança de apartamento de 2 dormitórios')).toBeInTheDocument();
  });

  it('registra o orçamento pela janela e avança a trilha', async () => {
    const u = userEvent.setup();
    abrir();
    const item = (await screen.findByText('Vazamento embaixo da pia da cozinha')).closest('.item') as HTMLElement;
    await u.click(within(item).getByRole('button', { name: 'Registrar orçamento' }));
    await u.type(screen.getByLabelText('Valor do serviço (R$) *'), '350');
    await u.click(screen.getByRole('button', { name: 'Enviar ao cliente' }));
    expect(await screen.findByText('Orçamento enviado ao cliente no app.')).toBeInTheDocument();
    const atualizado = (await screen.findByText('Vazamento embaixo da pia da cozinha')).closest('.item') as HTMLElement;
    expect(within(atualizado).getByText('Orçamento enviado')).toBeInTheDocument();
  });

  it('pede confirmação antes de cancelar', async () => {
    const u = userEvent.setup();
    abrir();
    const item = (await screen.findByText('Vazamento embaixo da pia da cozinha')).closest('.item') as HTMLElement;
    await u.click(within(item).getByRole('button', { name: 'Cancelar' }));
    expect(within(item).getByRole('button', { name: 'Confirmar: cancelar' })).toBeInTheDocument();
  });
});
