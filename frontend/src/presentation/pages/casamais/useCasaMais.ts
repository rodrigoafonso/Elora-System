import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDependencias } from '../../providers/ContainerContext';

/** Chaves de cache do Elora Casa+ (react-query). */
export const chavesCasaMais = {
  tudo: ['casamais'] as const,
  pedidos: ['casamais', 'pedidos'] as const,
  parceiros: ['casamais', 'parceiros'] as const,
  regras: ['casamais', 'regras'] as const,
  jornadas: ['casamais', 'jornadas'] as const,
  pacotes: ['casamais', 'pacotes'] as const,
  empresas: ['casamais', 'empresas'] as const,
};

/** Leituras da tela. Cada uma é independente: uma falha não derruba as outras. */
export function useDadosCasaMais() {
  const { casaMais } = useDependencias();
  const pedidos = useQuery({ queryKey: chavesCasaMais.pedidos, queryFn: () => casaMais.pedidos.listar() });
  const parceiros = useQuery({ queryKey: chavesCasaMais.parceiros, queryFn: () => casaMais.parceiros.listar() });
  const regras = useQuery({ queryKey: chavesCasaMais.regras, queryFn: () => casaMais.regras.obter() });
  const jornadas = useQuery({ queryKey: chavesCasaMais.jornadas, queryFn: () => casaMais.jornadas.listar() });
  const pacotes = useQuery({ queryKey: chavesCasaMais.pacotes, queryFn: () => casaMais.pacotes.listar() });
  const empresas = useQuery({ queryKey: chavesCasaMais.empresas, queryFn: () => casaMais.empresas.listar() });
  return { pedidos, parceiros, regras, jornadas, pacotes, empresas };
}

/**
 * Ação que chama um caso de uso e, ao terminar, atualiza os dados do Casa+ na tela.
 * Erros de regra chegam com a mensagem pronta (RegraVioladaError / problem+json da API).
 */
export function useAcaoCasaMais<A>(
  executar: (casos: ReturnType<typeof useDependencias>['casosCasaMais'], args: A) => Promise<unknown>,
) {
  const { casosCasaMais } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (args: A) => executar(casosCasaMais, args),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chavesCasaMais.tudo }),
  });
}
