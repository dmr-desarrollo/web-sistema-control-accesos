import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Bienvenido, {user?.email}</p>
      <p>Este es el panel de administración del sistema de control de visitas.</p>
    </div>
  );
}

export default Dashboard;
