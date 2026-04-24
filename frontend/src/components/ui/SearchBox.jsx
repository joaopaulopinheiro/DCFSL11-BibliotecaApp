// SearchBox.jsx
export function SearchBox({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="searchbox">
      <span className="searchbox__icon">⌕</span>
      <input
        className="searchbox__input"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && <button className="searchbox__clear" onClick={() => onChange('')}>✕</button>}
    </div>
  );
}
