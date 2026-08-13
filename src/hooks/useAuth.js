import {
  useContext
} from 'react';

import {
  AuthContext
} from '../context/AuthContext';

export const useAuth = () => {
  const contexto =
    useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider.'
    );
  }

  return contexto;
};
