// src/components/Logo.jsx
// Casa de HOMMI en SVG. Toma el color del texto (currentColor), así que
// funciona sobre cualquier fondo sin necesidad de un archivo de imagen.
function Logo({ size = 22, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2 1 12h3v10h6v-7h4v7h6V12h3z" />
    </svg>
  );
}

export default Logo;
