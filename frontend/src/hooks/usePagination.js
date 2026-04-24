import { useState, useMemo } from 'react';

/**
 * Hook de paginação genérico.
 *
 * @param {Array}  items     - lista completa a paginar
 * @param {number} pageSize  - itens por página (padrão: 12)
 *
 * Retorna:
 *  - paginatedItems  → slice da página atual
 *  - page            → página atual (1-based)
 *  - totalPages
 *  - setPage
 *  - resetPage()     → volta para página 1 (útil após filtro/busca)
 */
export function usePagination(items, pageSize = 12) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Se o filtro reduziu os resultados e a página atual ficou fora do range
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const resetPage = () => setPage(1);

  return {
    paginatedItems,
    page: safePage,
    totalPages,
    setPage,
    resetPage,
  };
}
