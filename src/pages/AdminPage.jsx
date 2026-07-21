import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/auth';

function AdminPage() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await logout();

    navigate('/login', {
      replace: true
    });
  };

  return (
    <div className="admin-page">
      <header className="admin-cabecera">
        <div>
          <h1>Administrador</h1>

          <p>
            Bienvenido,{' '}
            <strong>
              {perfil?.nombre ||
                perfil?.email}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </header>

      <section className="admin-opciones">
        <button
          type="button"
          className="admin-tarjeta"
          onClick={() =>
            navigate('/admin/empresas')
          }
        >
          <strong>Empresas</strong>

          <span>
            Crear y administrar empresas.
          </span>
        </button>

      <button
  type="button"
  className="admin-tarjeta"
  onClick={() =>
    navigate('/admin/usuarios')
  }
>
          <strong>Usuarios</strong>

          <span>
            Crear administradores y usuarios.
          </span>
        </button>
      </section>
    </div>
  );
}

export default AdminPage;