import { useState, useEffect } from 'react';
import { obtenerVisitas } from '../../services/visitas';

function HistorialVisitas() {
  const [visitas, setVisitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarVisitas();
  }, []);

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

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    if (fecha.seconds) return new Date(fecha.seconds * 1000).toLocaleString();
    return new Date(fecha).toLocaleString();
  };

  const exportarXLS = () => {
    if (visitas.length === 0) {
      alert('No hay visitas para exportar');
      return;
    }

    let tabla = `
      <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color:#D9EAF7;font-weight:bold;">
              <th>Fecha</th>
              <th>Visitante</th>
              <th>Cédula</th>
              <th>Empresa</th>
              <th>Persona visitada</th>
            </tr>
          </thead>
          <tbody>
    `;

    visitas.forEach((visita) => {
      tabla += `
        <tr>
          <td>${formatearFecha(visita.fecha)}</td>
          <td>${visita.visitanteNombre || ''} ${visita.visitanteApellido || ''}</td>
          <td>${visita.visitanteCedula || ''}</td>
          <td>${visita.empresa || ''}</td>
          <td>${visita.personaVisitableNombre || ''}</td>
        </tr>
      `;
    });

    tabla += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tabla], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `historial_visitas_${fecha}.xls`;
    link.click();

    URL.revokeObjectURL(url);
  };

  if (cargando) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="historial-visitas">
      <h2>Historial de Visitas</h2>

      <button onClick={exportarXLS}>
        Exportar historial XLS
      </button>

      {visitas.length === 0 ? (
        <p>No hay visitas registradas</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Visitante</th>
              <th>Cédula</th>
              <th>Empresa</th>
              <th>Persona Visitable</th>
            </tr>
          </thead>
          <tbody>
            {visitas.map((visita) => (
              <tr key={visita.id}>
                <td>{formatearFecha(visita.fecha)}</td>
                <td>{visita.visitanteNombre} {visita.visitanteApellido}</td>
                <td>{visita.visitanteCedula}</td>
                <td>{visita.empresa || ''}</td>
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