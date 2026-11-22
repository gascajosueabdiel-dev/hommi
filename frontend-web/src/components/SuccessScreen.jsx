// src/components/SuccessScreen.jsx
import './SuccessScreen.css';

function SuccessScreen({ titulo, subtitulo }) {
  return (
    <div className="success-screen">
      <div className="success-screen-icon">✓</div>
      <h2 className="success-screen-titulo">{titulo}</h2>
      {subtitulo && <p className="success-screen-sub">{subtitulo}</p>}
      <div className="success-screen-bar">
        <div className="success-screen-fill" />
      </div>
    </div>
  );
}

export default SuccessScreen;
