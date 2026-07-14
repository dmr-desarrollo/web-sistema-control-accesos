import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HistorialVisitas from '../components/visitas/HistorialVisitas';

describe('HistorialVisitas', () => {
  it('debería renderizar mensaje de carga inicialmente', () => {
    render(<HistorialVisitas />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});
