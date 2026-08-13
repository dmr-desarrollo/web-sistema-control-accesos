import {
  Navigate
} from 'react-router-dom';

import {
  useAuth
} from '../../hooks/useAuth';

function ProtectedRoute({
  children,
  allowedRoles = []
}) {
  const {
    user,
    perfil,
    loading,
    errorPerfil
  } = useAuth();

  /*
   * Esto debería aparecer únicamente
   * durante la carga inicial de la aplicación,
   * no en cada navegación.
   */
  if (loading) {
    return (
      <div className="dashboard-estado">
        Verificando sesión y permisos...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    errorPerfil ||
    !perfil
  ) {
    return (
      <div className="dashboard-estado dashboard-error">
        <h2>
          No se pudo cargar el perfil
        </h2>

        <p>
          {errorPerfil ||
            'El usuario no tiene un perfil registrado.'}
        </p>
      </div>
    );
  }

  if (
    perfil.estado ===
    'pendiente'
  ) {
    return (
      <Navigate
        to="/pendiente"
        replace
      />
    );
  }

  if (
    perfil.estado !==
    'activo'
  ) {
    return (
      <div className="dashboard-estado dashboard-error">
        <h2>
          Cuenta deshabilitada
        </h2>

        <p>
          Comunícate con un administrador
          para revisar el estado de tu cuenta.
        </p>
      </div>
    );
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(
      perfil.rol
    )
  ) {
    if (
      perfil.rol ===
      'superadmin'
    ) {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
