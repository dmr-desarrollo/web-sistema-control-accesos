import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Busca el perfil empresarial asociado al UID de Firebase Authentication.
 *
 * Ruta esperada:
 * usuarios/{uid}
 */
export const obtenerPerfilUsuario = async (uid) => {
  if (!uid) {
    throw new Error('No se recibió el UID del usuario');
  }

  const referencia = doc(db, 'usuarios', uid);
  const resultado = await getDoc(referencia);

  if (!resultado.exists()) {
    throw new Error(
      'La cuenta existe en Authentication, pero no tiene perfil en la colección usuarios'
    );
  }

  return {
    uid: resultado.id,
    ...resultado.data()
  };
};