/** Configuração lida das variáveis VITE_* (ver .env.example). */
export const env = {
  dataSource: (import.meta.env.VITE_DATA_SOURCE ?? 'mock') as 'mock' | 'api',
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  tenantId: import.meta.env.VITE_TENANT_ID ?? 'elora',
  router: (import.meta.env.VITE_ROUTER ?? 'browser') as 'browser' | 'hash',
} as const;
