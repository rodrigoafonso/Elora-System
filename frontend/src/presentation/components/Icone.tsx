/** Ícones do protótipo (traço 1,7–1,9 px, 24×24). Adicione novos em ICONES mantendo o mesmo estilo. */
const ICONES = {
  pasta: '<path d="M6 9l6 6 6-6"/>',
  sino: '<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  livro:
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8M8 11h6"/>',
  celular: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
  zap: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9.5 9.5c.3 1.6 1.9 3.6 4 4.3l1-1 1.6.8-.4 1.4c-3 .3-6.6-3.2-6.8-6l1.4-.5.8 1.6z"/>',
  ia: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
} as const;

export type NomeIcone = keyof typeof ICONES;

export function Icone({ nome, tamanho = 15, traco = 1.8 }: { nome: NomeIcone; tamanho?: number; traco?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONES[nome] }}
    />
  );
}
