import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';

import { db } from './firebase';

/**
 * Convierte el nombre o código escrito por el usuario
 * en un identificador seguro para Firestore.
 *
 * Ejemplo:
 * "Empresa Nueva S.A." -> "empresa-nueva-sa"
 */
export const normalizarCodigoEmpresa = (valor = '') => {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Obtiene todas las empresas registradas.
 */
export const obtenerEmpresas = async () => {
  const referencia = collection(db, 'empresas');
  const resultado = await getDocs(referencia);

  return resultado.docs
    .map((documento) => ({
      id: documento.id,
      ...documento.data()
    }))
    .sort((empresaA, empresaB) => {
      const nombreA =
        empresaA.nombre?.toLowerCase() || '';

      const nombreB =
        empresaB.nombre?.toLowerCase() || '';

      return nombreA.localeCompare(nombreB);
    });
};


/**
 * Obtiene los datos principales y la configuración
 * completa de una empresa.
 */
export const obtenerEmpresaPorId = async (
  empresaId
) => {
  const id =
    String(empresaId || '').trim();

  if (!id) {
    throw new Error(
      'No se pudo identificar la empresa.'
    );
  }

  const referenciaEmpresa = doc(
    db,
    'empresas',
    id
  );

  const referenciaConfiguracion = doc(
    db,
    'empresas',
    id,
    'configuracion',
    'general'
  );

  const [
    empresaDocumento,
    configuracionDocumento
  ] = await Promise.all([
    getDoc(referenciaEmpresa),
    getDoc(referenciaConfiguracion)
  ]);

  if (!empresaDocumento.exists()) {
    throw new Error(
      'La empresa seleccionada no existe.'
    );
  }

  const datosEmpresa =
    empresaDocumento.data();

  const configuracion =
    configuracionDocumento.exists()
      ? configuracionDocumento.data()
      : {};

  return {
    id: empresaDocumento.id,
    ...datosEmpresa,
    email:
      configuracion.email || '',
    telefono:
      configuracion.telefono || '',
    direccion:
      configuracion.direccion || '',
    idioma:
      configuracion.idioma || 'es',
    zonaHoraria:
      configuracion.zonaHoraria ||
      'America/Montevideo',
    horarioInicio:
      configuracion.horarioInicio ||
      '09:00',
    horarioFin:
      configuracion.horarioFin ||
      '18:00',
    colorPrimario:
      configuracion.colorPrimario ||
      '#2563EB',
    colorSecundario:
      configuracion.colorSecundario ||
      '#1E40AF'
  };
};



/**
 * Crea:
 *
 * empresas/{codigo}
 *
 * y además:
 *
 * empresas/{codigo}/configuracion/general
 */
export const crearEmpresa = async ({
  nombre,
  codigo,
  email,
  telefono,
  direccion,
  idioma,
  zonaHoraria,
  horarioInicio,
  horarioFin,
  colorPrimario,
  colorSecundario,
  creadaPor
}) => {
  const codigoNormalizado =
    normalizarCodigoEmpresa(codigo || nombre);

  if (!codigoNormalizado) {
    throw new Error(
      'No fue posible generar un código válido para la empresa.'
    );
  }

  if (!nombre?.trim()) {
    throw new Error(
      'El nombre de la empresa es obligatorio.'
    );
  }

  if (!creadaPor) {
    throw new Error(
      'No se pudo identificar al administrador que crea la empresa.'
    );
  }

  const referenciaEmpresa = doc(
    db,
    'empresas',
    codigoNormalizado
  );

  const referenciaConfiguracion = doc(
    db,
    'empresas',
    codigoNormalizado,
    'configuracion',
    'general'
  );

  await setDoc(referenciaEmpresa, {
    nombre: nombre.trim(),
    codigo: codigoNormalizado,
    activa: true,
    creadaPor,
    fechaCreacion: serverTimestamp()
  });

  await setDoc(referenciaConfiguracion, {
    nombreEmpresa: nombre.trim(),
    nombreSistema: 'Control de Visitas',
    logoUrl: '',
    colorPrimario:
      colorPrimario || '#2563EB',
    colorSecundario:
      colorSecundario || '#1E40AF',
    telefono: telefono?.trim() || '',
    direccion: direccion?.trim() || '',
    email: email?.trim().toLowerCase() || '',
    horarioInicio: horarioInicio || '09:00',
    horarioFin: horarioFin || '18:00',
    idioma: idioma || 'es',
    zonaHoraria:
      zonaHoraria || 'America/Montevideo',
    ocrHabilitado: true,
    registroManualHabilitado: true,
    activa: true,
    fechaActualizacion: serverTimestamp(),
    actualizadaPor: creadaPor
  });

  return {
    id: codigoNormalizado,
    nombre: nombre.trim(),
    codigo: codigoNormalizado,
    activa: true
  };
};


/**
 * Actualiza la información general de una empresa.
 *
 * El código/ID de la empresa no se modifica porque
 * también identifica el documento en Firestore.
 */
export const actualizarEmpresa = async ({
  id,
  nombre,
  email,
  telefono,
  direccion,
  idioma,
  zonaHoraria,
  horarioInicio,
  horarioFin,
  colorPrimario,
  colorSecundario,
  actualizadaPor
}) => {
  const empresaId =
    String(id || '').trim();

  if (!empresaId) {
    throw new Error(
      'No se pudo identificar la empresa.'
    );
  }

  if (!nombre?.trim()) {
    throw new Error(
      'El nombre de la empresa es obligatorio.'
    );
  }

  if (!actualizadaPor) {
    throw new Error(
      'No se pudo identificar al administrador.'
    );
  }

  const referenciaEmpresa = doc(
    db,
    'empresas',
    empresaId
  );

  const referenciaConfiguracion = doc(
    db,
    'empresas',
    empresaId,
    'configuracion',
    'general'
  );

  const lote = writeBatch(db);

  lote.update(referenciaEmpresa, {
    nombre: nombre.trim(),
    fechaActualizacion:
      serverTimestamp(),
    actualizadaPor
  });

  lote.set(
    referenciaConfiguracion,
    {
      nombreEmpresa: nombre.trim(),
      email:
        email?.trim().toLowerCase() ||
        '',
      telefono:
        telefono?.trim() || '',
      direccion:
        direccion?.trim() || '',
      idioma: idioma || 'es',
      zonaHoraria:
        zonaHoraria ||
        'America/Montevideo',
      horarioInicio:
        horarioInicio || '09:00',
      horarioFin:
        horarioFin || '18:00',
      colorPrimario:
        colorPrimario || '#2563EB',
      colorSecundario:
        colorSecundario || '#1E40AF',
      fechaActualizacion:
        serverTimestamp(),
      actualizadaPor
    },
    {
      merge: true
    }
  );

  await lote.commit();

  return {
    id: empresaId,
    nombre: nombre.trim()
  };
};

/**
 * Cambia el estado de una empresa y de su
 * configuración general.
 */
export const cambiarEstadoEmpresa = async ({
  id,
  activa,
  actualizadaPor
}) => {
  const empresaId =
    String(id || '').trim();

  if (!empresaId) {
    throw new Error(
      'No se pudo identificar la empresa.'
    );
  }

  if (typeof activa !== 'boolean') {
    throw new Error(
      'El estado de la empresa no es válido.'
    );
  }

  if (!actualizadaPor) {
    throw new Error(
      'No se pudo identificar al administrador.'
    );
  }

  const referenciaEmpresa = doc(
    db,
    'empresas',
    empresaId
  );

  const referenciaConfiguracion = doc(
    db,
    'empresas',
    empresaId,
    'configuracion',
    'general'
  );

  const lote = writeBatch(db);

  lote.update(referenciaEmpresa, {
    activa,
    fechaActualizacion:
      serverTimestamp(),
    actualizadaPor
  });

  lote.set(
    referenciaConfiguracion,
    {
      activa,
      fechaActualizacion:
        serverTimestamp(),
      actualizadaPor
    },
    {
      merge: true
    }
  );

  await lote.commit();

  return {
    id: empresaId,
    activa
  };
};

