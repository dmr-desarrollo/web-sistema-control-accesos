import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc
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