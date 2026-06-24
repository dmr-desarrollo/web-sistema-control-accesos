import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmailAndPassword } from '../services/auth';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      await loginWithEmailAndPassword(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas');
      console.error('Error login:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Control de Visitas</h1>
      <h2>Iniciar Sesión</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
