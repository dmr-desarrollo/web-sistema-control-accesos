import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'personasVisitable';

export const crearPersonaVisitable = async (datos) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      nombre: datos.nombre,
      apellido: datos.apellido,
      organizacionId: 'organizacion-1',
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw new Error('Error al crear persona visitable: ' + error.message);
  }
};

export const obtenerPersonasVisitables = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Error al obtener personas visitables: ' + error.message);
  }
};

export const actualizarPersonaVisitable = async (id, datos) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      nombre: datos.nombre,
      apellido: datos.apellido,
      updatedAt: new Date()
    });
  } catch (error) {
    throw new Error('Error al actualizar persona visitable: ' + error.message);
  }
};

export const eliminarPersonaVisitable = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error('Error al eliminar persona visitable: ' + error.message);
  }
};
