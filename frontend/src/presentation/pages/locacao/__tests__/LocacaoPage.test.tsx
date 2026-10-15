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
  const router = createMemoryRouter(rotas, { initialEntries: ['/locacao'] });
  render(
    <Provedores container={montarContainer(criarCasaMaisMemoria(), criarLocacaoMemoria())}>
      <RouterProvider router={router} />
    </Provedores>,
  );
};

describe('Locação (equipe)', () => {
  it('mostra a agenda legal e a tabela de contratos', async () => {
    abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Locação' })).toBeInTheDocument();
    expect(await screen.findByText('Janela da ação renovatória aberta', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Contratos · 2/ })).toBeInTheDocument();
    expect(screen.getByText('Bruna Teles')).toBeInTheDocument();
  });

  it('recusa caução acima de três aluguéis e mostra a lei', async () => {
    const u = userEvent.setup();
    abrir();
    await u.click(await screen.findByRole('button', { name: 'Novo contrato' }));
    await u.selectOptions(screen.getByLabelText('Imóvel *'), 'im-112');
    await u.selectOptions(screen.getByLabelText('Locatário *'), 'pe-3');
    await u.type(screen.getByLabelText('Início *'), '2026-11-01');
    await u.type(screen.getByLabelText('Fim do prazo *'), '2029-04-30');
    await u.type(screen.getByLabelText('Aluguel (R$) *'), '3000');
    await u.selectOptions(screen.getByLabelText('Garantia (uma só, art. 37)'), 'caucao_dinheiro');
    await u.type(screen.getByLabelText('Valor da caução (R$)'), '12000');
    await u.click(screen.getByRole('button', { name: 'Salvar' }));
    const erros = await screen.findByRole('alert');
    expect(erros).toHaveTextContent('Caução acima de três aluguéis');
    expect(within(erros).getByText('Lei 8.245/91, art. 38, § 2º')).toBeInTheDocument();

    await u.clear(screen.getByLabelText('Valor da caução (R$)'));
    await u.type(screen.getByLabelText('Valor da caução (R$)'), '9000');
    await u.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Contrato cadastrado.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Contratos · 3/ })).toBeInTheDocument();
  });
});
