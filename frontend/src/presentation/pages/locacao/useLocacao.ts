import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDependencias } from '../../providers/ContainerContext';

export const chavesLocacao = {
  tudo: ['locacao'] as const,
  contratos: ['locacao', 'contratos'] as const,
  cadastros: ['locacao', 'cadastros'] as const,
};

export function useDadosLocacao() {
  const { locacao } = useDependencias();
  const contratos = useQuery({ queryKey: chavesLocacao.contratos, queryFn: () => locacao.contratos.listar() });
  const cadastros = useQuery({
    queryKey: chavesLocacao.cadastros,
    queryFn: async () => {
      const [imoveis, locatarios, corretores] = await Promise.all([
        locacao.cadastros.imoveis(),
        locacao.cadastros.locatarios(),
        locacao.cadastros.corretores(),
      ]);
      return { imoveis, locatarios, corretores };
    },
    staleTime: 5 * 60_000,
  });
  return { contratos, cadastros };
}

export function useAcaoLocacao<A>(
  executar: (casos: ReturnType<typeof useDependencias>['casosLocacao'], args: A) => Promise<unknown>,
) {
  const { casosLocacao } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (args: A) => executar(casosLocacao, args),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chavesLocacao.tudo }),
  });
}
