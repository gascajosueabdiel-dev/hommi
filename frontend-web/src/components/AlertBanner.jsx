import './AlertBanner.css';

// tipo puede ser: 'error' | 'warning' | 'success'
function AlertBanner({ mensaje, tipo = 'error', children }) {
  if (!mensaje && !children) return null; // no renderiza nada si no hay mensaje

  return (
    <div className={`alert-banner alert-banner--${tipo}`} role="alert">
      {mensaje}
      {children}
    </div>
  );
}

export default AlertBanner;