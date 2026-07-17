import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../services/firebase';
import { obtenerPerfilUsuario } from '../services/usuarios';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (usuarioFirebase) => {
        setLoading(true);
        setErrorPerfil('');

        if (!usuarioFirebase) {
          setUser(null);
          setPerfil(null);
          setLoading(false);
          return;
        }

        try {
          const perfilUsuario =
            await obtenerPerfilUsuario(usuarioFirebase.uid);

          setUser(usuarioFirebase);
          setPerfil(perfilUsuario);
        } catch (error) {
          console.error(
            'Error obteniendo el perfil del usuario:',
            error
          );

          setUser(usuarioFirebase);
          setPerfil(null);
          setErrorPerfil(error.message);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    user,
    perfil,
    loading,
    errorPerfil,
    autenticado: Boolean(user),
    activo: perfil?.estado === 'activo',
    rol: perfil?.rol || null,
    empresaId: perfil?.empresaId || null
  };
};