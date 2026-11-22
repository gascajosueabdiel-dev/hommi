import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { registerEstudiante, registerArrendador } from '../services/authService';
import AuthShell from '../components/AuthShell';

const CAMPOS = {
  estudiante: ['nombre', 'email', 'universidad', 'password', 'sexo'],
  arrendador: ['nombre', 'email', 'password', 'telefono'],  
};

// Traduce el mensaje que manda el backend a un texto claro para el usuario.
// (El backend a veces solo manda "Validation error" cuando el correo ya existe.)
function interpretarError(mensaje, rol) {
  const m = (mensaje || '').toLowerCase();

  if (m.includes('validation len') || m.includes('longitud')) {
    return 'Revisa la longitud de tus datos: el correo admite hasta 40 caracteres y la contraseña de 8 a 50.';
  }
  if (m.includes('isemail') || m.includes('formato')) {
    return 'El formato del correo no es válido.';
  }
  if (m.includes('telefono') || m.includes('teléfono') || m.includes('phone')) {
    return 'El número de teléfono ya está asociado a otra cuenta.';
  }
  if (m.includes('correo') || m.includes('email')) {
    return 'El correo electrónico ya se encuentra registrado.';
  }

  // Mensaje genérico (p. ej. "Validation error"): casi siempre es un duplicado
  return rol === 'estudiante'
    ? 'El correo electrónico ya se encuentra registrado o los datos son inválidos.'
    : 'El correo electrónico o el teléfono ya se encuentran registrados en el sistema.';
}

function Register() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [rol,      setRol]      = useState(
    searchParams.get('rol') === 'arrendador' ? 'arrendador' : 'estudiante'
  );
  const [form,     setForm]     = useState({ nombre: '', email: '', universidad: '', password: '', sexo: '', telefono: '' });
  const [errores,  setErrores]  = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  function handleChange(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => ({ ...prev, [campo]: '' }));
    setApiError('');
  }

  function validar() {
    const nuevosErrores = {};
    const requeridos = CAMPOS[rol];

    if (requeridos.includes('nombre') && !form.nombre.trim())
      nuevosErrores.nombre = 'Este campo es obligatorio';

    if (requeridos.includes('email')) {
      if (!form.email.trim())
        nuevosErrores.email = 'Este campo es obligatorio';
      else if (!form.email.includes('@') || !form.email.includes('.'))
        nuevosErrores.email = 'Formato de correo inválido';
      else if (form.email.length > 40)
        nuevosErrores.email = 'Máximo 40 caracteres';
    }

    if (requeridos.includes('universidad') && !form.universidad.trim())
      nuevosErrores.universidad = 'Este campo es obligatorio';

    if (requeridos.includes('password')) {
      if (!form.password)
        nuevosErrores.password = 'Este campo es obligatorio';
      else if (form.password.length < 8)
        nuevosErrores.password = 'Debe tener al menos 8 caracteres';
      else if (form.password.length > 50)
        nuevosErrores.password = 'Máximo 50 caracteres';
    }

    if (requeridos.includes('sexo') && !form.sexo)
      nuevosErrores.sexo = 'Selecciona una opción';

    if (requeridos.includes('telefono')) {
      if (!form.telefono.trim())
        nuevosErrores.telefono = 'Este campo es obligatorio';
      else if (!/^\d{10}$/.test(form.telefono))
        nuevosErrores.telefono = 'Debe tener 10 dígitos';
    }

    return nuevosErrores;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    const erroresValidacion = validar();
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    const datosConSexo = {
      ...form,
      id_catsexo: form.sexo === 'hombre' ? 1 : 2,
    };

    setLoading(true);
    try {
      if (rol === 'estudiante') {
        await registerEstudiante(datosConSexo);
      } else {
        await registerArrendador(datosConSexo);
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setApiError(interpretarError(err.message, rol));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell variante={rol}>
        <div className="auth-success">
          <div className="auth-success-icon">✓</div>
          <h2>¡Cuenta creada exitosamente!</h2>
          <p>Redirigiendo al inicio de sesión...</p>
          <div className="auth-progress-bar">
            <div className="auth-progress-fill" />
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell variante={rol}>
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-sub">
          {rol === 'estudiante' ? 'Registro para estudiantes' : 'Registro para arrendadores'}
        </p>

        <div className="auth-tabs" role="group" aria-label="Tipo de cuenta">
          <button
            type="button"
            className={`auth-tab ${rol === 'estudiante' ? 'auth-tab--active' : ''}`}
            aria-pressed={rol === 'estudiante'}
            onClick={() => { setRol('estudiante'); setErrores({}); setApiError(''); }}
          >
            Estudiante
          </button>
          <button
            type="button"
            className={`auth-tab ${rol === 'arrendador' ? 'auth-tab--active' : ''}`}
            aria-pressed={rol === 'arrendador'}
            onClick={() => { setRol('arrendador'); setErrores({}); setApiError(''); }}
          >
            Arrendador
          </button>
        </div>

        {/* ⚠️ Muestra el banner rojo con el mensaje dinámico de duplicado */}
        {apiError && (
          <div className="auth-banner auth-banner--error" role="alert">
            {apiError}
            {apiError.toLowerCase().includes('correo') && (
              <div style={{ marginTop: 6 }}>
                <Link to="/login" className="auth-link-inline">Iniciar sesión con esta cuenta</Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          <div className="auth-field">
            <label htmlFor="reg-nombre">Nombre completo *</label>
            <input
              id="reg-nombre"
              type="text"
              placeholder="Ej. Ana García López"
              maxLength={70}
              value={form.nombre}
              onChange={e => handleChange('nombre', e.target.value)}
              autoComplete="name"
              className={errores.nombre ? 'input-error' : ''}
              aria-invalid={Boolean(errores.nombre)}
              disabled={loading}
            />
            {errores.nombre && <span className="auth-field-error">{errores.nombre}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Correo electrónico *</label>
            <input
              id="reg-email"
              type="email"
              placeholder={rol === 'estudiante' ? 'correo@universidad.mx' : 'correo@ejemplo.mx'}
              maxLength={40}
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              className={errores.email ? 'input-error' : ''}
              aria-invalid={Boolean(errores.email)}
              disabled={loading}
              autoComplete="email"
            />
            {errores.email && <span className="auth-field-error">{errores.email}</span>}
          </div>

          {/* Solo estudiante */}
          {rol === 'estudiante' && (
            <div className="auth-field">
              <label htmlFor="reg-uni">Universidad *</label>
              <input
                id="reg-uni"
                type="text"
                placeholder="Nombre de tu universidad"
                value={form.universidad}
                onChange={e => handleChange('universidad', e.target.value)}
                className={errores.universidad ? 'input-error' : ''}
              aria-invalid={Boolean(errores.universidad)}
                disabled={loading}
              />
              {errores.universidad && <span className="auth-field-error">{errores.universidad}</span>}
            </div>
          )}

          {rol === 'estudiante' && (
            <div className="auth-field">
              <label id="reg-sexo-label">Sexo *</label>
              <div className="auth-gender-group" role="group" aria-labelledby="reg-sexo-label">
                <button
                  type="button"
                  className={`auth-gender-btn ${form.sexo === 'hombre' ? 'active' : ''}`}
                  aria-pressed={form.sexo === 'hombre'}
                  onClick={() => handleChange('sexo', 'hombre')}
                >
                  Hombre
                </button>
                <button
                  type="button"
                  className={`auth-gender-btn ${form.sexo === 'mujer' ? 'active' : ''}`}
                  aria-pressed={form.sexo === 'mujer'}
                  onClick={() => handleChange('sexo', 'mujer')}
                >
                  Mujer
                </button>
              </div>
              {errores.sexo && <span className="auth-field-error">{errores.sexo}</span>}
            </div>
          )}

          {/* Solo arrendador */}
          {rol === 'arrendador' && (
            <div className="auth-field">
              <label htmlFor="reg-telefono">Teléfono *</label>
              <input
                id="reg-telefono"
                type="tel"
                placeholder="5512345678"
                value={form.telefono}
                onChange={e => handleChange('telefono', e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                autoComplete="tel"
                className={errores.telefono ? 'input-error' : ''}
              aria-invalid={Boolean(errores.telefono)}
                disabled={loading}
                maxLength={10}
              />
              {errores.telefono && <span className="auth-field-error">{errores.telefono}</span>}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="reg-password">Contraseña *</label>
            <input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              maxLength={50}
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              className={errores.password ? 'input-error' : ''}
              aria-invalid={Boolean(errores.password)}
              disabled={loading}
              autoComplete="new-password"
            />
            {errores.password
              ? <span className="auth-field-error">{errores.password}</span>
              : <span className="auth-field-hint">Mínimo 8 caracteres</span>
            }
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading
              ? <><span className="auth-spinner" /> Creando cuenta...</>
              : 'Crear cuenta'
            }
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
    </AuthShell>
  );
}

export default Register;
