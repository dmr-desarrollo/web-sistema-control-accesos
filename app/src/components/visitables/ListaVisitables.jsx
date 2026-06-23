import { useState, useEffect } from 'react';
import { obtenerPersonasVisitables, eliminarPersonaVisitable } from '../../services/visitables';

function ListaVisitables({ onEditar, onRecargar }) {
  const [visitables, setVisitables] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarVisitables = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerPersonasVisitables();
      setVisitables(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVisitables();
  }, []);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta persona visitable?')) {
      try {
        await eliminarPersonaVisitable(id);
        cargarVisitables();
        if (onRecargar) onRecargar();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="lista-visitables">
      <h2>Personas Visitables</h2>
      {visitables.length === 0 ? (
        <p>No hay personas visitables registradas</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visitables.map((visitable) => (
              <tr key={visitable.id}>
                <td>{visitable.nombre}</td>
                <td>{visitable.apellido}</td>
                <td>
                  <button onClick={() => onEditar(visitable)}>Editar</button>
                  <button onClick={() => handleEliminar(visitable.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ListaVisitables;
