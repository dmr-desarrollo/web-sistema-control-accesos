import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  obtenerVisitas,
  obtenerVisitaPorId,
  crearVisita
} from '../services/visitas';

vi.mock('../services/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn()
}));

describe('VisitasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería exportar funciones de visitas', () => {
    expect(typeof obtenerVisitas).toBe('function');
    expect(typeof obtenerVisitaPorId).toBe('function');
    expect(typeof crearVisita).toBe('function');
  });
});
