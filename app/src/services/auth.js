import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    throw new Error(error.message);
  }
};
