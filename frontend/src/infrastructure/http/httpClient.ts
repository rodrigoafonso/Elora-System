import { env } from '@/config/env';

/** Erro vindo da API no formato application/problem+json (RFC 9457). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Cliente HTTP único da aplicação: base URL, tenant, token e tratamento de erro num só lugar.
 * O token de acesso virá do provedor de identidade (OIDC) quando o login for ligado.
 */
export async function http<T>(metodo: Metodo, caminho: string, corpo?: unknown, token?: string): Promise<T> {
  const resposta = await fetch(`${env.apiUrl}${caminho}`, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      'X-Tenant-Id': env.tenantId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
  });
  if (!resposta.ok) {
    let detalhe = 'Não foi possível concluir agora. Tente de novo.';
    try {
      const p = (await resposta.json()) as { detail?: string; title?: string };
      detalhe = p.detail ?? p.title ?? detalhe;
    } catch {
      /* corpo vazio */
    }
    throw new ApiError(resposta.status, detalhe);
  }
  return (resposta.status === 204 ? undefined : await resposta.json()) as T;
}
