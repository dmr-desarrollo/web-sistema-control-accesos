import { useEffect, useState } from 'react';
import { obtenerVisitas } from '../../services/visitas';
import { utils, writeFileXLSX } from 'xlsx';

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
      setError(null);

      const data = await obtenerVisitas();
      setVisitas(data);
    } catch (err) {
      console.error(
        'Error cargando historial:',
        err
      );

      setError(
        err.message ||
          'No fue posible cargar el historial'
      );
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return '';
    }

    if (typeof fecha.toDate === 'function') {
      return fecha
        .toDate()
        .toLocaleString('es-UY');
    }

    if (fecha.seconds) {
      return new Date(
        fecha.seconds * 1000
      ).toLocaleString('es-UY');
    }

    const resultado = new Date(fecha);

    if (Number.isNaN(resultado.getTime())) {
      return '';
    }

    return resultado.toLocaleString('es-UY');
  };

  const exportarXLS = () => {
    if (visitas.length === 0) {
      alert('No hay visitas para exportar');
      return;
    }

    const datosExcel = visitas.map(
      (visita) => ({
        Fecha: formatearFecha(
          visita.fecha
        ),

        Visitante: `${
          visita.visitanteNombre || ''
        } ${
          visita.visitanteApellido || ''
        }`.trim(),

        Cédula:
          visita.visitanteCedula || '',

        Empresa:
          visita.empresa || '',

        'Persona visitada':
          visita.personaVisitableNombre ||
          ''
      })
    );

    const hoja =
      utils.json_to_sheet(datosExcel);

    hoja['!cols'] = [
      { wch: 22 },
      { wch: 35 },
      { wch: 18 },
      { wch: 25 },
      { wch: 35 }
    ];

    hoja['!autofilter'] = {
      ref: `A1:E${datosExcel.length + 1}`
    };

    const libro = utils.book_new();

    utils.book_append_sheet(
      libro,
      hoja,
      'Historial'
    );

    const fechaArchivo = new Date()
      .toISOString()
      .slice(0, 10);

    writeFileXLSX(
      libro,
      `historial_visitas_${fechaArchivo}.xlsx`
    );
  };

  if (cargando) {
    return (
      <div className="dashboard-estado">
        Cargando historial...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-estado dashboard-error">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="historial-visitas">
      <div className="historial-cabecera">
        <h1>Historial de visitas</h1>

        <button
          type="button"
          className="boton-exportar"
          onClick={exportarXLS}
        >
          Exportar XLSX
        </button>
      </div>

      {visitas.length === 0 ? (
        <p>No hay visitas registradas</p>
      ) : (
        <div className="tabla-responsive">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Visitante</th>
                <th>Cédula</th>
                <th>Empresa</th>
                <th>Persona visitada</th>
              </tr>
            </thead>

            <tbody>
              {visitas.map((visita) => (
                <tr key={visita.id}>
                  <td>
                    {formatearFecha(
                      visita.fecha
                    )}
                  </td>

                  <td>
                    {visita.visitanteNombre}{' '}
                    {
                      visita.visitanteApellido
                    }
                  </td>

                  <td>
                    {visita.visitanteCedula}
                  </td>

                  <td>
                    {visita.empresa || ''}
                  </td>

                  <td>
                    {
                      visita.personaVisitableNombre
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HistorialVisitas;
