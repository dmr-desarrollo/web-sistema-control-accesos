import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { email: 'test@test.com' } })
}));

describe('Layout', () => {
  it('debería renderizar navegación', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Contenido</div>
        </Layout>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Control de Visitas')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Personas Visitables')).toBeInTheDocument();
    expect(screen.getByText('Historial')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
  });

  it('debería renderizar children', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Contenido de prueba</div>
        </Layout>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
  });
});
