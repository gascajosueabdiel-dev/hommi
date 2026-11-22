// src/components/LoadingSpinner.jsx
import './LoadingSpinner.css';

function LoadingSpinner({ mensaje = 'Cargando...' }) {
  return (
    <div className="loading-spinner-wrap">
      <span className="loading-spinner" />
      {mensaje}
    </div>
  );
}

export default LoadingSpinner;