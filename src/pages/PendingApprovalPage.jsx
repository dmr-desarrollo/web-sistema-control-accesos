import { useNavigate } from 'react-router-dom';

import { logout } from '../services/auth';

function PendingApprovalPage() {
  const navigate = useNavigate();

  const volverAlLogin = async () => {
    await logout();

    navigate('/login', {
      replace: true
    });
  };

  return (
    <div className="login-container">
      <h1>Cuenta pendiente</h1>

      <h2>
        Tu registro debe ser aprobado
      </h2>

      <p>
        La cuenta fue creada correctamente,
        pero todavía no tiene autorización
        para utilizar el sistema.
      </p>

      <button
        type="button"
        onClick={volverAlLogin}
      >
        Volver al inicio
      </button>
    </div>
  );
}

export default PendingApprovalPage;