// Pagination.jsx
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Gera janela de até 5 números ao redor da página atual
  const range = [];
  const delta = 2;
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(1)} title="Primeira">«</button>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} title="Anterior">‹</button>

      {left > 1 && (
        <>
          <button onClick={() => onPageChange(1)}>1</button>
          {left > 2 && <span className="pagination__ellipsis">…</span>}
        </>
      )}

      {range.map(n => (
        <button
          key={n}
          onClick={() => onPageChange(n)}
          className={n === page ? 'pagination__btn--active' : ''}
          disabled={n === page}
        >
          {n}
        </button>
      ))}

      {right < totalPages && (
        <>
          {right < totalPages - 1 && <span className="pagination__ellipsis">…</span>}
          <button onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} title="Próxima">›</button>
      <button disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} title="Última">»</button>
    </div>
  );
}
