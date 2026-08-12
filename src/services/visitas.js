import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';

import { db } from './firebase';

const COLLECTION_NAME = 'visitas';

const validarEmpresaId = (empresaId) => {
  const id =
    String(empresaId || '').trim();

  if (!id) {
    throw new Error(
      'No se pudo identificar la empresa.'
    );
  }

  return id;
};

/**
 * Crea una visita vinculada a una empresa.
 *
 * El empresaId debe provenir del perfil del
 * usuario autenticado, no de una selección libre.
 */
export const crearVisita = async ({
  empresaId,
  empresaNombre = '',
  visitanteNombre,
  visitanteApellido,
  visitanteCedula,
  visitanteFechaNacimiento,
  personaVisitableId,
  personaVisitableNombre,
  motivo = '',
  creadoPorUid = '',
  origen = 'web'
}) => {
  try {
    const empresa =
      validarEmpresaId(empresaId);

    const referencia = await addDoc(
      collection(
        db,
        COLLECTION_NAME
      ),
      {
        empresaId: empresa,
        empresaNombre:
          String(
            empresaNombre || ''
          ).trim(),

        visitanteNombre:
          String(
            visitanteNombre || ''
          ).trim(),

        visitanteApellido:
          String(
            visitanteApellido || ''
          ).trim(),

        visitanteCedula:
          String(
            visitanteCedula || ''
          ).trim(),

        visitanteFechaNacimiento:
          visitanteFechaNacimiento || '',

        personaVisitableId:
          String(
            personaVisitableId || ''
          ).trim(),

        personaVisitableNombre:
          String(
            personaVisitableNombre || ''
          ).trim(),

        motivo:
          String(
            motivo || ''
          ).trim(),

        creadoPorUid:
          String(
            creadoPorUid || ''
          ).trim(),

        origen:
          origen === 'android'
            ? 'android'
            : 'web',

        fecha: serverTimestamp()
      }
    );

    return referencia.id;
  } catch (error) {
    throw new Error(
      `Error al crear visita: ${error.message}`
    );
  }
};

/**
 * Obtiene únicamente las visitas de una empresa.
 */
export const obtenerVisitas = async ({
  empresaId
}) => {
  try {
    const empresa =
      validarEmpresaId(empresaId);

    const consulta = query(
      collection(
        db,
        COLLECTION_NAME
      ),
      where(
        'empresaId',
        '==',
        empresa
      ),
      orderBy(
        'fecha',
        'desc'
      )
    );

    const resultado =
      await getDocs(consulta);

    return resultado.docs.map(
      (documento) => ({
        id: documento.id,
        ...documento.data()
      })
    );
  } catch (error) {
    throw new Error(
      `Error al obtener visitas: ${error.message}`
    );
  }
};

/**
 * Obtiene una visita y comprueba que pertenezca
 * a la empresa solicitada.
 */
export const obtenerVisitaPorId = async ({
  id,
  empresaId
}) => {
  try {
    const visitaId =
      String(id || '').trim();

    const empresa =
      validarEmpresaId(empresaId);

    if (!visitaId) {
      throw new Error(
        'No se pudo identificar la visita.'
      );
    }

    const referencia = doc(
      db,
      COLLECTION_NAME,
      visitaId
    );

    const resultado =
      await getDoc(referencia);

    if (!resultado.exists()) {
      throw new Error(
        'Visita no encontrada.'
      );
    }

    const visita =
      resultado.data();

    if (
      visita.empresaId !== empresa
    ) {
      throw new Error(
        'La visita no pertenece a la empresa seleccionada.'
      );
    }

    return {
      id: resultado.id,
      ...visita
    };
  } catch (error) {
    throw new Error(
      `Error al obtener visita: ${error.message}`
    );
  }
};

/**
 * Obtiene las visitas de una empresa dentro
 * de un día determinado.
 */
export const obtenerVisitasPorFecha = async ({
  empresaId,
  fecha
}) => {
  try {
    const empresa =
      validarEmpresaId(empresaId);

    if (!fecha) {
      throw new Error(
        'Debes indicar una fecha.'
      );
    }

    const inicio =
      new Date(fecha);

    inicio.setHours(
      0,
      0,
      0,
      0
    );

    const fin =
      new Date(fecha);

    fin.setHours(
      23,
      59,
      59,
      999
    );

    const consulta = query(
      collection(
        db,
        COLLECTION_NAME
      ),
      where(
        'empresaId',
        '==',
        empresa
      ),
      where(
        'fecha',
        '>=',
        inicio
      ),
      where(
        'fecha',
        '<=',
        fin
      ),
      orderBy(
        'fecha',
        'desc'
      )
    );

    const resultado =
      await getDocs(consulta);

    return resultado.docs.map(
      (documento) => ({
        id: documento.id,
        ...documento.data()
      })
    );
  } catch (error) {
    throw new Error(
      `Error al obtener visitas por fecha: ${error.message}`
    );
  }
};
