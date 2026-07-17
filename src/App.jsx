import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import VisitablesPage from './pages/VisitablesPage';
import VisitasPage from './pages/VisitasPage';
import AdminPage from './pages/AdminPage';
import PendingApprovalPage from './pages/PendingApprovalPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/pendiente"
          element={
            <ProtectedRoute>
              <PendingApprovalPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={['superadmin']}
            >
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                'admin_empresa',
                'operador'
              ]}
            >
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/visitables"
          element={
            <ProtectedRoute
              allowedRoles={[
                'admin_empresa'
              ]}
            >
              <Layout>
                <VisitablesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/visitas"
          element={
            <ProtectedRoute
              allowedRoles={[
                'admin_empresa',
                'operador'
              ]}
            >
              <Layout>
                <VisitasPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/registro"
          element={
            <div className="login-container">
              <h1>Registro</h1>

              <p>
                El formulario de registro se
                agregará en la siguiente etapa.
              </p>

              <a href="/login">
                Volver al inicio de sesión
              </a>
            </div>
          }
        />

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;