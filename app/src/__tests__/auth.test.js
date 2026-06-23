import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginWithEmailAndPassword, logout } from '../services/auth';

// Mock de Firebase
vi.mock('../services/firebase', () => ({
  auth: {
    signOut: vi.fn(),
  },
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería exportar funciones de autenticación', () => {
    expect(typeof loginWithEmailAndPassword).toBe('function');
    expect(typeof logout).toBe('function');
  });
});
