import { useAuth } from '../../hooks/useAuth';

import UsuariosPage from '../admin/UsuariosPage';

function UsuariosEmpresaPage() {
  const { perfil } = useAuth();

  const empresaId =
    String(
      perfil?.empresaId || ''
    ).trim();

  if (!empresaId) {
    return (
      <div className="dashboard-estado dashboard-error">
        <h2>
          Empresa no asignada
        </h2>

        <p>
          El administrador no tiene una empresa
          vinculada a su perfil.
        </p>
      </div>
    );
  }

  return <UsuariosPage />;
}

export default UsuariosEmpresaPage;
