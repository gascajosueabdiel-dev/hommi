import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser, getHomePath } from '../services/authService';
import AuthShell from '../components/AuthShell';

function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // La sesión expiró si nos mandó aquí una ruta protegida (state.expired)
  // o si authService detectó que el token ya venció (marca en sessionStorage).
  // Se calcula una sola vez para que el aviso no desaparezca al escribir.
  const [sessionExpired] = useState(
    () =>
      location.state?.expired === true ||
      sessionStorage.getItem('sessionExpired') === '1'
  );

  const [email,    setEmail]    = useState(sessionExpired ? (location.state?.email ?? '') : '');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  // La marca solo debe mostrarse una vez
  useEffect(() => {
    sessionStorage.removeItem('sessionExpired');
  }, []);

  function validar() {
    if (!email.trim())        return 'El correo es obligatorio';
    if (!email.includes('@')) return 'Ingresa un correo válido';
    if (!password)            return 'La contraseña es obligatoria';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const err = validar();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      // loginUser ya guarda el token y el usuario en sessionStorage
      const user = await loginUser(email, password);
      setSuccess(true); // muestra el cuadro de éxito
      setTimeout(() => navigate(getHomePath(user)), 2500); // redirige después de 2.5s
    } catch (err) {
      setError(err.message || 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  // Pantalla de éxito
  if (success) {
    return (
      <AuthShell variante="login">
        <div className="auth-success">
          <div className="auth-success-icon">✓</div>
          <h2>¡Ingresaste correctamente!</h2>
          <p>Redirigiendo...</p>
          <div className="auth-progress-bar">
            <div className="auth-progress-fill" />
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell variante="login">
      <h1 className="auth-title">Bienvenido a HOMMI</h1>
      <p className="auth-sub">Ingresa con tu cuenta</p>

      {sessionExpired && (
        <div className="auth-banner auth-banner--warning" role="status">
          Tu sesión ha expirado. Inicia sesión nuevamente para continuar.
        </div>
      )}

      {error && (
        <div className="auth-banner auth-banner--error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            placeholder="correo@ejemplo.mx"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            className={error ? 'input-error' : ''}
            aria-invalid={Boolean(error)}
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Contraseña</label>
          <div className="auth-pw-wrap">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className={error ? 'input-error' : ''}
              aria-invalid={Boolean(error)}
              disabled={loading}
              autoComplete="current-password"
            />
            <button type="button" className="auth-toggle-pw"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {showPw ? '🐵' : '🙈'}
            </button>
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading
            ? <><span className="auth-spinner" /> Verificando...</>
            : (error ? 'Intentar de nuevo' : 'Iniciar sesión')
          }
        </button>
      </form>

      <p className="auth-switch">
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </AuthShell>
  );
}

export default Login;
