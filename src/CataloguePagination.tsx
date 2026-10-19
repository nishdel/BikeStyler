export default function CataloguePagination({page, total, onPage}: {page: number; total: number; onPage: (page: number) => void}) {
  if (total <= 24) return null;
  const pages = Math.ceil(total / 24);
  return <nav className="catalogue-pagination" aria-label="Catalogue pages">
    <button disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous page</button>
    <span aria-live="polite">{page} / {pages}</span>
    <button disabled={page >= pages} onClick={() => onPage(page + 1)}>Next page</button>
  </nav>;
}
