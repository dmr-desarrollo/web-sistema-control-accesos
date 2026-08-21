import { useState } from 'react';

import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';

function Layout({ children }) {
  const {
    user,
    perfil
  } = useAuth();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    menuAbierto,
    setMenuAbierto
  ] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();

      navigate('/login', {
        replace: true
      });
    } catch (error) {
      console.error(
        'Error al cerrar sesión:',
        error
      );
    }
  };

  const isActive = (path) => {
    return (
      location.pathname === path
    );
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  const esAdminEmpresa =
    perfil?.rol === 'admin_empresa';

  const obtenerCargo = () => {
    switch (perfil?.rol) {
      case 'superadmin':
        return 'Administrador global';

      case 'admin_empresa':
        return 'Administrador de empresa';

      case 'operador':
        return 'Operador';

      default:
        return 'Usuario';
    }
  };

  const nombreCompleto = [
    perfil?.nombre,
    perfil?.apellido
  ]
    .filter(Boolean)
    .join(' ');

  const nombreVisible =
    nombreCompleto ||
    user?.email ||
    'Usuario';

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="menu-control-visitas">
          <button
            type="button"
            className="boton-control-visitas"
            onClick={() =>
              setMenuAbierto(
                !menuAbierto
              )
            }
          >
            Control de Visitas

            <span className="flecha-menu">
              {menuAbierto
                ? '▲'
                : '▼'}
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

              {esAdminEmpresa && (
                <Link
                  to="/empresa/usuarios"
                  className={
                    isActive(
                      '/empresa/usuarios'
                    )
                      ? 'submenu-activo'
                      : ''
                  }
                  onClick={cerrarMenu}
                >
                  Usuarios de la empresa
                </Link>
              )}

            </div>
          )}
        </div>

        <div className="navbar-user">
          <div className="navbar-identidad">
            <span className="navbar-bienvenida">
              Bienvenido,{' '}
              <strong>
                {nombreVisible}
              </strong>
            </span>

            <span className="navbar-cargo">
              Cargo:{' '}
              <strong>
                {obtenerCargo()}
              </strong>
            </span>
          </div>

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
