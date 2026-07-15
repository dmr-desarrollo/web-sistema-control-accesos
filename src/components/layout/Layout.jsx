import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';

function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="menu-control-visitas">
          <button
            type="button"
            className="boton-control-visitas"
            onClick={() =>
              setMenuAbierto(!menuAbierto)
            }
          >
            Control de Visitas
            <span className="flecha-menu">
              {menuAbierto ? '▲' : '▼'}
            </span>
          </button>

          {menuAbierto && (
            <div className="submenu-control-visitas">
              <Link
                to="/dashboard"
                className={
                  isActive('/dashboard')
                    ? 'submenu-activo'
                    : ''
                }
                onClick={cerrarMenu}
              >
                Panel de visitas
              </Link>

              <Link
                to="/visitas"
                className={
                  isActive('/visitas')
                    ? 'submenu-activo'
                    : ''
                }
                onClick={cerrarMenu}
              >
                Historial de visitas
              </Link>
            </div>
          )}
        </div>

        <div className="navbar-user">
          <span>
            Bienvenido,{' '}
            <strong>{user?.email}</strong>
          </span>

          <button
            type="button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
