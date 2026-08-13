import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';

import { db } from './firebase';

const COLLECTION_NAME =
  'personasVisitable';

const validarEmpresaId = (
  empresaId
) => {
  const id =
    String(
      empresaId || ''
    ).trim();

  if (!id) {
    throw new Error(
      'No se pudo identificar la empresa.'
    );
  }

  return id;
};

const validarDatosVisitable = ({
  nombre,
  apellido
}) => {
  const nombreLimpio =
    String(
      nombre || ''
    ).trim();

  const apellidoLimpio =
    String(
      apellido || ''
    ).trim();

  if (!nombreLimpio) {
    throw new Error(
      'El nombre es obligatorio.'
    );
  }

  if (!apellidoLimpio) {
    throw new Error(
      'El apellido es obligatorio.'
    );
  }

  return {
    nombre: nombreLimpio,
    apellido: apellidoLimpio
  };
};

/**
 * Crea una persona visitable.
 */
export const crearPersonaVisitable =
  async ({
    empresaId,
    nombre,
    apellido,
    creadoPorUid = ''
  }) => {
    try {
      const empresa =
        validarEmpresaId(
          empresaId
        );

      const datos =
        validarDatosVisitable({
          nombre,
          apellido
        });

      const referencia =
        await addDoc(
          collection(
            db,
            COLLECTION_NAME
          ),
          {
            ...datos,
            empresaId: empresa,
            estado: 'activo',
            creadoPorUid:
              String(
                creadoPorUid || ''
              ).trim(),
            fechaCreacion:
              serverTimestamp(),
            fechaActualizacion:
              serverTimestamp()
          }
        );

      return referencia.id;
    } catch (error) {
      throw new Error(
        `Error al crear persona visitable: ${error.message}`
      );
    }
  };

/**
 * Obtiene las personas visitables
 * de una empresa.
 */
export const obtenerPersonasVisitables =
  async ({
    empresaId,
    incluirInactivos = true
  }) => {
    try {
      const empresa =
        validarEmpresaId(
          empresaId
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
        )
      );

      const resultado =
        await getDocs(
          consulta
        );

      let personas =
        resultado.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data()
          })
        );

      if (!incluirInactivos) {
        personas =
          personas.filter(
            (persona) =>
              persona.estado ===
              'activo'
          );
      }

      personas.sort(
        (
          personaA,
          personaB
        ) => {
          const fechaA =
            personaA.fechaCreacion
              ?.toMillis?.() || 0;

          const fechaB =
            personaB.fechaCreacion
              ?.toMillis?.() || 0;

          return fechaB - fechaA;
        }
      );

      return personas;
    } catch (error) {
      throw new Error(
        `Error al obtener personas visitables: ${error.message}`
      );
    }
  };

/**
 * Obtiene una persona visitable
 * concreta y valida su empresa.
 */
export const obtenerPersonaVisitablePorId =
  async ({
    id,
    empresaId
  }) => {
    try {
      const visitableId =
        String(
          id || ''
        ).trim();

      const empresa =
        validarEmpresaId(
          empresaId
        );

      if (!visitableId) {
        throw new Error(
          'No se pudo identificar la persona visitable.'
        );
      }

      const referencia = doc(
        db,
        COLLECTION_NAME,
        visitableId
      );

      const resultado =
        await getDoc(
          referencia
        );

      if (!resultado.exists()) {
        throw new Error(
          'La persona visitable no existe.'
        );
      }

      const datos =
        resultado.data();

      if (
        datos.empresaId !==
        empresa
      ) {
        throw new Error(
          'La persona visitable no pertenece a la empresa seleccionada.'
        );
      }

      return {
        id: resultado.id,
        ...datos
      };
    } catch (error) {
      throw new Error(
        `Error al obtener persona visitable: ${error.message}`
      );
    }
  };

/**
 * Actualiza una persona visitable.
 */
export const actualizarPersonaVisitable =
  async ({
    id,
    empresaId,
    nombre,
    apellido,
    actualizadoPorUid = ''
  }) => {
    try {
      const visitable =
        await obtenerPersonaVisitablePorId({
          id,
          empresaId
        });

      const datos =
        validarDatosVisitable({
          nombre,
          apellido
        });

      const referencia = doc(
        db,
        COLLECTION_NAME,
        visitable.id
      );

      await updateDoc(
        referencia,
        {
          ...datos,
          fechaActualizacion:
            serverTimestamp(),
          actualizadoPorUid:
            String(
              actualizadoPorUid || ''
            ).trim()
        }
      );

      return {
        id: visitable.id,
        ...datos
      };
    } catch (error) {
      throw new Error(
        `Error al actualizar persona visitable: ${error.message}`
      );
    }
  };

/**
 * Activa o desactiva una persona visitable.
 */
export const cambiarEstadoPersonaVisitable =
  async ({
    id,
    empresaId,
    estado,
    actualizadoPorUid = ''
  }) => {
    try {
      if (
        estado !== 'activo' &&
        estado !== 'inactivo'
      ) {
        throw new Error(
          'El estado seleccionado no es válido.'
        );
      }

      const visitable =
        await obtenerPersonaVisitablePorId({
          id,
          empresaId
        });

      const referencia = doc(
        db,
        COLLECTION_NAME,
        visitable.id
      );

      await updateDoc(
        referencia,
        {
          estado,
          fechaActualizacion:
            serverTimestamp(),
          actualizadoPorUid:
            String(
              actualizadoPorUid || ''
            ).trim()
        }
      );

      return {
        id: visitable.id,
        estado
      };
    } catch (error) {
      throw new Error(
        `Error al cambiar el estado de la persona visitable: ${error.message}`
      );
    }
  };
  