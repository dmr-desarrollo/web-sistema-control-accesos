import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ListaVisitables from '../components/visitables/ListaVisitables';

describe('ListaVisitables', () => {
  it('debería renderizar mensaje de carga inicialmente', () => {
    render(<ListaVisitables />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});
