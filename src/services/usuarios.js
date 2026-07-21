import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where
} from 'firebase/firestore';

import { getFunctions, httpsCallable } from 'firebase/functions';

import { db } from './firebase';

const functions = getFunctions();

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

/**
 * Obtiene todos los usuarios ordenados por nombre.
 */
export const listarUsuarios = async () => {
  const consulta = query(
    collection(db, 'usuarios'),
    orderBy('nombre')
  );

  const resultado = await getDocs(consulta);

  return resultado.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data()
  }));
};

/**
 * Obtiene las empresas activas para mostrarlas
 * en el selector del formulario de usuarios.
 */
export const obtenerEmpresasActivas = async () => {
  const consulta = query(
    collection(db, 'empresas'),
    where('activa', '==', true)
  );

  const resultado = await getDocs(consulta);

  return resultado.docs
    .map((documento) => ({
      id: documento.id,
      ...documento.data()
    }))
    .sort((empresaA, empresaB) =>
      String(empresaA.nombre || '').localeCompare(
        String(empresaB.nombre || ''),
        'es'
      )
    );
};

/**
 * Crea un usuario mediante la Cloud Function segura.
 *
 * La función crea:
 * - la cuenta en Firebase Authentication;
 * - el perfil en usuarios/{uid}.
 */
export const crearUsuarioAdministrado = async (datosUsuario) => {
  try {
    const ejecutarCreacion = httpsCallable(
      functions,
      'crearUsuarioAdministrado'
    );

    const respuesta = await ejecutarCreacion(datosUsuario);

    return respuesta.data;
  } catch (error) {
    console.error('Error al crear el usuario:', error);

    const mensajeFirebase =
      error?.message ||
      error?.details ||
      'No fue posible crear el usuario';

    throw new Error(mensajeFirebase);
  }
};

/**
 * Actualiza un usuario mediante la Cloud Function segura.
 */
export const actualizarUsuario = async (datosUsuario) => {
  try {
    const ejecutarActualizacion = httpsCallable(
      functions,
      'actualizarUsuarioAdministrado'
    );

    const respuesta = await ejecutarActualizacion(datosUsuario);

    return respuesta.data;
  } catch (error) {
    console.error(
      'Error al actualizar el usuario:',
      error
    );

    const mensaje =
      error?.message ||
      error?.details ||
      'No fue posible actualizar el usuario';

    throw new Error(mensaje);
  }
};

/**
 * Activa o desactiva un usuario mediante
 * la Cloud Function segura.
 */
export const cambiarEstadoUsuario = async ({
  uid,
  estado
}) => {
  try {
    const ejecutarCambioEstado = httpsCallable(
      functions,
      'cambiarEstadoUsuarioAdministrado'
    );

    const respuesta =
      await ejecutarCambioEstado({
        uid,
        estado
      });

    return respuesta.data;
  } catch (error) {
    console.error(
      'Error al cambiar el estado del usuario:',
      error
    );

    const mensaje =
      error?.details ||
      error?.message ||
      'No fue posible cambiar el estado del usuario';

    throw new Error(mensaje, {
      cause: error
    });
  }
};

/**
 * Cambia la contraseña temporal de un usuario
 * mediante la Cloud Function segura.
 */
export const cambiarPasswordTemporal = async ({
  uid,
  password
}) => {
  try {
    const ejecutarCambioPassword = httpsCallable(
      functions,
      'cambiarPasswordTemporalAdministrado'
    );

    const respuesta =
      await ejecutarCambioPassword({
        uid,
        password
      });

    return respuesta.data;
  } catch (error) {
    console.error(
      'Error al cambiar la contraseña:',
      error
    );

    const mensaje =
      error?.details ||
      error?.message ||
      'No fue posible cambiar la contraseña';

    throw new Error(mensaje, {
      cause: error
    });
  }
};


