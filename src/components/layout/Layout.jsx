import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';

function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/dashboard">Control de Visitas</Link>
        </div>
        <ul className="navbar-menu">
          <li>
            <Link 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'active' : ''}
            >
              Dashboard
            </Link>
          </li>

          <li>
            <Link 
              to="/visitas" 
              className={isActive('/visitas') ? 'active' : ''}
            >
              Historial
            </Link>
          </li>
        </ul>
        <div className="navbar-user">
          <span>{user?.email}</span>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
