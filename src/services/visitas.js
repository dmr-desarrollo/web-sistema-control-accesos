import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';

import { db } from './firebase';

const COLLECTION_NAME =
  'visitas';

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

const obtenerMilisegundosFecha = (
  fecha
) => {
  if (!fecha) {
    return 0;
  }

  if (
    typeof fecha.toMillis ===
    'function'
  ) {
    return fecha.toMillis();
  }

  if (
    typeof fecha.toDate ===
    'function'
  ) {
    return fecha
      .toDate()
      .getTime();
  }

  if (fecha.seconds) {
    return (
      fecha.seconds *
      1000
    );
  }

  const resultado =
    new Date(fecha);

  if (
    Number.isNaN(
      resultado.getTime()
    )
  ) {
    return 0;
  }

  return resultado.getTime();
};

export const crearVisita =
  async ({
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
        validarEmpresaId(
          empresaId
        );

      const referencia =
        await addDoc(
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
              visitanteFechaNacimiento ||
              '',

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

            fecha:
              serverTimestamp()
          }
        );

      return referencia.id;
    } catch (error) {
      throw new Error(
        `Error al crear visita: ${error.message}`
      );
    }
  };

export const obtenerVisitas =
  async ({
    empresaId
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

      const visitas =
        resultado.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data()
          })
        );

      visitas.sort(
        (
          visitaA,
          visitaB
        ) =>
          obtenerMilisegundosFecha(
            visitaB.fecha
          ) -
          obtenerMilisegundosFecha(
            visitaA.fecha
          )
      );

      return visitas;
    } catch (error) {
      throw new Error(
        `Error al obtener visitas: ${error.message}`
      );
    }
  };

export const obtenerVisitaPorId =
  async ({
    id,
    empresaId
  }) => {
    try {
      const visitaId =
        String(
          id || ''
        ).trim();

      const empresa =
        validarEmpresaId(
          empresaId
        );

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
        await getDoc(
          referencia
        );

      if (!resultado.exists()) {
        throw new Error(
          'Visita no encontrada.'
        );
      }

      const visita =
        resultado.data();

      if (
        visita.empresaId !==
        empresa
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

export const obtenerVisitasPorFecha =
  async ({
    empresaId,
    fecha
  }) => {
    try {
      const visitas =
        await obtenerVisitas({
          empresaId
        });

      if (!fecha) {
        return visitas;
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

      return visitas.filter(
        (visita) => {
          const tiempo =
            obtenerMilisegundosFecha(
              visita.fecha
            );

          if (!tiempo) {
            return false;
          }

          return (
            tiempo >=
              inicio.getTime() &&
            tiempo <=
              fin.getTime()
          );
        }
      );
    } catch (error) {
      throw new Error(
        `Error al obtener visitas por fecha: ${error.message}`
      );
    }
  };
  