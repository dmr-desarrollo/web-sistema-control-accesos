import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  crearPersonaVisitable,
  obtenerPersonasVisitables,
  actualizarPersonaVisitable,
  eliminarPersonaVisitable
} from '../services/visitables';

vi.mock('../services/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn()
}));

describe('VisitablesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería exportar funciones CRUD', () => {
    expect(typeof crearPersonaVisitable).toBe('function');
    expect(typeof obtenerPersonasVisitables).toBe('function');
    expect(typeof actualizarPersonaVisitable).toBe('function');
    expect(typeof eliminarPersonaVisitable).toBe('function');
  });
});
