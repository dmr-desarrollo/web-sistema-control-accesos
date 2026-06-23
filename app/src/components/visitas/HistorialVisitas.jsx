import { useState, useEffect } from 'react';
import { obtenerVisitas } from '../../services/visitas';

function HistorialVisitas() {
  const [visitas, setVisitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarVisitas = async () => {
      try {
        setCargando(true);
        const data = await obtenerVisitas();
        setVisitas(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarVisitas();
  }, []);

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="historial-visitas">
      <h2>Historial de Visitas</h2>
      {visitas.length === 0 ? (
        <p>No hay visitas registradas</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Visitante</th>
              <th>Cédula</th>
              <th>Persona Visitable</th>
            </tr>
          </thead>
          <tbody>
            {visitas.map((visita) => (
              <tr key={visita.id}>
                <td>{new Date(visita.fecha.seconds * 1000).toLocaleString()}</td>
                <td>{visita.visitanteNombre} {visita.visitanteApellido}</td>
                <td>{visita.visitanteCedula}</td>
                <td>{visita.personaVisitableNombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default HistorialVisitas;
