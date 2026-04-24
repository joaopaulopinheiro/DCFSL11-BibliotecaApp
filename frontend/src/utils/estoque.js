/**
 * Status que consomem estoque
 */
const STATUS_ATIVOS = ['pendente', 'aprovado'];

/**
 * Calcula estoque disponível de um livro
 */
export function estoqueDisponivel(livro, pedidos = []) {
  if (!livro) return 0;

  let ativos = 0;

  for (const p of pedidos) {
    if (
      p.livro_id === livro.id &&
      STATUS_ATIVOS.includes(p.status)
    ) {
      ativos++;
    }
  }

  const total = livro.estoque ?? 0;

  return Math.max(total - ativos, 0);
}

/**
 * Retorna true se ainda tem estoque disponível
 */
export function temEstoqueDisponivel(livro, pedidos = []) {
  return estoqueDisponivel(livro, pedidos) > 0;
}

/**
 * Cria um mapa de contagem de pedidos ativos por livro (OTIMIZAÇÃO)
 * Ideal pra listas grandes (catálogo)
 */
export function mapearPedidosAtivos(pedidos = []) {
  const mapa = {};

  for (const p of pedidos) {
    if (!STATUS_ATIVOS.includes(p.status)) continue;

    mapa[p.livro_id] = (mapa[p.livro_id] || 0) + 1;
  }

  return mapa;
}

/**
 * Versão otimizada usando mapa pré-calculado
 */
export function estoqueDisponivelComMapa(livro, mapaPedidos = {}) {
  if (!livro) return 0;

  const total = livro.estoque ?? 0;
  const ativos = mapaPedidos[livro.id] || 0;

  return Math.max(total - ativos, 0);
}
