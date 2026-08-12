import {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  utils,
  writeFileXLSX
} from 'xlsx';

import { useAuth } from '../../hooks/useAuth';
import { obtenerVisitas } from '../../services/visitas';

function HistorialVisitas() {
  const { perfil } = useAuth();

  const [visitas, setVisitas] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  const cargarVisitas = useCallback(async () => {
    const empresaId =
      String(
        perfil?.empresaId || ''
      ).trim();

    if (!empresaId) {
      setVisitas([]);

      setError(
        'El usuario no tiene una empresa asignada.'
      );

      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError('');

      const datos =
        await obtenerVisitas({
          empresaId
        });

      setVisitas(datos);
    } catch (err) {
      console.error(
        'Error cargando historial:',
        err
      );

      setError(
        err.message ||
          'No fue posible cargar el historial.'
      );
    } finally {
      setCargando(false);
    }
  }, [
    perfil?.empresaId
  ]);

  useEffect(() => {
    cargarVisitas();
  }, [
    cargarVisitas
  ]);

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return '';
    }

    if (
      typeof fecha.toDate ===
      'function'
    ) {
      return fecha
        .toDate()
        .toLocaleString(
          'es-UY'
        );
    }

    if (fecha.seconds) {
      return new Date(
        fecha.seconds * 1000
      ).toLocaleString(
        'es-UY'
      );
    }

    const resultado =
      new Date(fecha);

    if (
      Number.isNaN(
        resultado.getTime()
      )
    ) {
      return '';
    }

    return resultado.toLocaleString(
      'es-UY'
    );
  };

  const obtenerNombreEmpresa = (
    visita
  ) => {
    return (
      visita.empresaNombre ||
      visita.empresa ||
      perfil?.empresaNombre ||
      perfil?.empresaId ||
      ''
    );
  };

  const exportarXLS = () => {
    if (visitas.length === 0) {
      alert(
        'No hay visitas para exportar.'
      );

      return;
    }

    const datosExcel =
      visitas.map((visita) => ({
        Fecha:
          formatearFecha(
            visita.fecha
          ),

        Visitante: [
          visita.visitanteNombre,
          visita.visitanteApellido
        ]
          .filter(Boolean)
          .join(' '),

        Cédula:
          visita.visitanteCedula ||
          '',

        Empresa:
          obtenerNombreEmpresa(
            visita
          ),

        'Persona visitada':
          visita
            .personaVisitableNombre ||
          '',

        Motivo:
          visita.motivo || '',

        Origen:
          visita.origen || 'web'
      }));

    const hoja =
      utils.json_to_sheet(
        datosExcel
      );

    hoja['!cols'] = [
      { wch: 22 },
      { wch: 35 },
      { wch: 18 },
      { wch: 28 },
      { wch: 35 },
      { wch: 30 },
      { wch: 14 }
    ];

    hoja['!autofilter'] = {
      ref:
        `A1:G${
          datosExcel.length + 1
        }`
    };

    const libro =
      utils.book_new();

    utils.book_append_sheet(
      libro,
      hoja,
      'Historial'
    );

    const fechaArchivo =
      new Date()
        .toISOString()
        .slice(0, 10);

    const empresaArchivo =
      String(
        perfil?.empresaId ||
        'empresa'
      )
        .trim()
        .replace(
          /[^a-zA-Z0-9-_]+/g,
          '-'
        );

    writeFileXLSX(
      libro,
      `historial_visitas_${empresaArchivo}_${fechaArchivo}.xlsx`
    );
  };

  const nombreEmpresa =
    perfil?.empresaNombre ||
    perfil?.empresaId ||
    'Sin empresa asignada';

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
        <h2>
          No se pudo cargar el historial
        </h2>

        <p>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="historial-visitas">
      <div className="historial-cabecera">
        <div>
          <h1>
            Historial de visitas
          </h1>

          <p>
            Empresa:{' '}
            <strong>
              {nombreEmpresa}
            </strong>
          </p>
        </div>

        <div className="botones">
          <button
            type="button"
            onClick={cargarVisitas}
          >
            Actualizar
          </button>

          <button
            type="button"
            className="boton-exportar"
            onClick={exportarXLS}
            disabled={
              visitas.length === 0
            }
          >
            Exportar XLSX
          </button>
        </div>
      </div>

      {visitas.length === 0 ? (
        <div className="dashboard-sin-datos">
          No hay visitas registradas
          para esta empresa.
        </div>
      ) : (
        <div className="tabla-responsive">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Visitante</th>
                <th>Cédula</th>
                <th>Empresa</th>
                <th>
                  Persona visitada
                </th>
                <th>Motivo</th>
                <th>Origen</th>
              </tr>
            </thead>

            <tbody>
              {visitas.map(
                (visita) => {
                  const nombreVisitante = [
                    visita
                      .visitanteNombre,
                    visita
                      .visitanteApellido
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <tr key={visita.id}>
                      <td>
                        {formatearFecha(
                          visita.fecha
                        )}
                      </td>

                      <td>
                        {nombreVisitante ||
                          'Sin nombre'}
                      </td>

                      <td>
                        {visita
                          .visitanteCedula ||
                          ''}
                      </td>

                      <td>
                        {obtenerNombreEmpresa(
                          visita
                        )}
                      </td>

                      <td>
                        {visita
                          .personaVisitableNombre ||
                          ''}
                      </td>

                      <td>
                        {visita.motivo ||
                          ''}
                      </td>

                      <td>
                        {visita.origen ||
                          'web'}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HistorialVisitas;
