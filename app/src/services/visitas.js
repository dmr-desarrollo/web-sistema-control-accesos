import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'visitas';

export const crearVisita = async (datos) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      visitanteNombre: datos.visitanteNombre,
      visitanteApellido: datos.visitanteApellido,
      visitanteCedula: datos.visitanteCedula,
      visitanteFechaNacimiento: datos.visitanteFechaNacimiento,
      personaVisitableId: datos.personaVisitableId,
      personaVisitableNombre: datos.personaVisitableNombre,
      fecha: new Date(),
      organizacionId: 'organizacion-1'
    });
    return docRef.id;
  } catch (error) {
    throw new Error('Error al crear visita: ' + error.message);
  }
};

export const obtenerVisitas = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('fecha', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Error al obtener visitas: ' + error.message);
  }
};

export const obtenerVisitaPorId = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Visita no encontrada');
    }
  } catch (error) {
    throw new Error('Error al obtener visita: ' + error.message);
  }
};

export const obtenerVisitasPorFecha = async (fecha) => {
  try {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('fecha', '>=', inicio),
      where('fecha', '<=', fin),
      orderBy('fecha', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Error al obtener visitas por fecha: ' + error.message);
  }
};
