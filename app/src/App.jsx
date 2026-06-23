import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import VisitablesPage from './pages/VisitablesPage';
import VisitasPage from './pages/VisitasPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/visitables" 
          element={
            <ProtectedRoute>
              <Layout>
                <VisitablesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/visitas" 
          element={
            <ProtectedRoute>
              <Layout>
                <VisitasPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
