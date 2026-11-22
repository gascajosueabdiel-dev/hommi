// src/components/SearchFilters.jsx
// Barra de búsqueda (texto + precio máximo) compartida por el catálogo
// y por el panel del arrendador.
import './SearchFilters.css';

function SearchFilters({
  query,
  precioMax,
  onQueryChange,
  onPrecioChange,
  onSubmit,
  onClear,
  placeholder = 'Buscar por dirección o colonia...',
  submitLabel = 'Buscar',
  clearLabel  = 'Limpiar',
  variant = 'dark', // 'dark' (sobre fondo oscuro) | 'light' (sobre fondo claro)
}) {
  const hayFiltros = Boolean(query || precioMax);

  return (
    <form
      className={`search-filters ${variant === 'light' ? 'search-filters--light' : ''}`}
      onSubmit={onSubmit}
      role="search"
    >
      <input
        type="text"
        className="search-filters-input"
        placeholder={placeholder}
        aria-label={placeholder}
        value={query}
        onChange={e => onQueryChange(e.target.value)}
      />
      <input
        type="number"
        min="0"
        inputMode="numeric"
        className="search-filters-input search-filters-input--precio"
        placeholder="Precio máximo"
        aria-label="Precio máximo"
        value={precioMax}
        onChange={e => onPrecioChange(e.target.value)}
      />
      <button type="submit" className="search-filters-btn">
        {submitLabel}
      </button>
      {hayFiltros && (
        <button type="button" className="search-filters-clear" onClick={onClear}>
          {clearLabel}
        </button>
      )}
    </form>
  );
}

export default SearchFilters;
