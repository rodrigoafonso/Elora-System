import { env } from '@/config/env';

/** Erro vindo da API no formato application/problem+json (RFC 9457). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Corpo do problem+json (pode trazer propriedades extras, ex.: "problemas"). */
    readonly corpo: Record<string, unknown> = {},
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
    let problema: Record<string, unknown> = {};
    try {
      problema = (await resposta.json()) as Record<string, unknown>;
      detalhe = String(problema.detail ?? problema.title ?? detalhe);
    } catch {
      /* corpo vazio */
    }
    throw new ApiError(resposta.status, detalhe, problema);
  }
  return (resposta.status === 204 ? undefined : await resposta.json()) as T;
}
