import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  utils,
  writeFileXLSX
} from 'xlsx';

import { useAuth } from '../../hooks/useAuth';
import { obtenerVisitas } from '../../services/visitas';
import { listarUsuarios } from '../../services/usuarios';

const FILTRO_SIN_USUARIO =
  '__sin_usuario__';

function HistorialVisitas() {
  const {
    user,
    perfil
  } = useAuth();

  const [visitas, setVisitas] =
    useState([]);

  const [usuariosEmpresa, setUsuariosEmpresa] =
    useState([]);

  const [usuarioFiltro, setUsuarioFiltro] =
    useState('');

  const [cargando, setCargando] =
    useState(true);

  const [exportando, setExportando] =
    useState(false);

  const [error, setError] =
    useState('');

  const esAdminEmpresa =
    perfil?.rol === 'admin_empresa';

  const esOperador =
    perfil?.rol === 'operador';

  const uidActual =
    String(
      perfil?.uid ||
      user?.uid ||
      ''
    ).trim();

  const cargarVisitas = useCallback(async () => {
    const empresaId =
      String(
        perfil?.empresaId || ''
      ).trim();

    if (!empresaId) {
      setVisitas([]);
      setUsuariosEmpresa([]);

      setError(
        'El usuario no tiene una empresa asignada.'
      );

      setCargando(false);
      return;
    }

    if (
      esOperador &&
      !uidActual
    ) {
      setVisitas([]);

      setError(
        'No se pudo identificar al usuario conectado.'
      );

      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError('');

      /*
       * OPERADOR:
       * consulta solamente sus propias visitas.
       *
       * ADMIN_EMPRESA:
       * consulta todas las visitas de su empresa.
       */
      const promesaVisitas =
        obtenerVisitas({
          empresaId,
          creadoPorUid:
            esOperador
              ? uidActual
              : ''
        });

      const promesaUsuarios =
        esAdminEmpresa
          ? listarUsuarios({
              empresaId
            })
          : Promise.resolve([]);

      const [
        datosVisitas,
        datosUsuarios
      ] = await Promise.all([
        promesaVisitas,
        promesaUsuarios
      ]);

      setVisitas(
        datosVisitas
      );

      setUsuariosEmpresa(
        datosUsuarios
      );
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
    perfil?.empresaId,
    esAdminEmpresa,
    esOperador,
    uidActual
  ]);

  useEffect(() => {
    cargarVisitas();
  }, [
    cargarVisitas
  ]);

  const mapaUsuarios =
    useMemo(() => {
      const mapa = {};

      usuariosEmpresa.forEach(
        (usuario) => {
          const nombre = [
            usuario.nombre,
            usuario.apellido
          ]
            .filter(Boolean)
            .join(' ')
            .trim();

          mapa[usuario.uid] =
            nombre ||
            usuario.email ||
            usuario.uid;
        }
      );

      /*
       * Si existe una visita cuyo UID ya no
       * aparece en la lista de usuarios,
       * conservamos igualmente el UID visible.
       */
      visitas.forEach(
        (visita) => {
          const uid =
            String(
              visita.creadoPorUid || ''
            ).trim();

          if (
            uid &&
            !mapa[uid]
          ) {
            mapa[uid] =
              `Usuario ${uid}`;
          }
        }
      );

      return mapa;
    }, [
      usuariosEmpresa,
      visitas
    ]);

  const opcionesUsuarios =
    useMemo(() => {
      const uidsConVisitas =
        new Set(
          visitas
            .map(
              (visita) =>
                String(
                  visita.creadoPorUid || ''
                ).trim()
            )
            .filter(Boolean)
        );

      return Object
        .entries(mapaUsuarios)
        .filter(
          ([uid]) =>
            uidsConVisitas.has(uid)
        )
        .map(
          ([uid, nombre]) => ({
            uid,
            nombre
          })
        )
        .sort(
          (a, b) =>
            a.nombre.localeCompare(
              b.nombre,
              'es'
            )
        );
    }, [
      visitas,
      mapaUsuarios
    ]);

  const visitasMostradas =
    useMemo(() => {
      if (
        !esAdminEmpresa ||
        !usuarioFiltro
      ) {
        return visitas;
      }

      if (
        usuarioFiltro ===
        FILTRO_SIN_USUARIO
      ) {
        return visitas.filter(
          (visita) =>
            !String(
              visita.creadoPorUid || ''
            ).trim()
        );
      }

      return visitas.filter(
        (visita) =>
          String(
            visita.creadoPorUid || ''
          ).trim() ===
          usuarioFiltro
      );
    }, [
      visitas,
      esAdminEmpresa,
      usuarioFiltro
    ]);

  const existeVisitaSinUsuario =
    useMemo(
      () =>
        visitas.some(
          (visita) =>
            !String(
              visita.creadoPorUid || ''
            ).trim()
        ),
      [visitas]
    );

  const obtenerNombreRegistrador = (
    visita
  ) => {
    const uid =
      String(
        visita.creadoPorUid || ''
      ).trim();

    if (!uid) {
      return 'Sin usuario identificado';
    }

    if (mapaUsuarios[uid]) {
      return mapaUsuarios[uid];
    }

    if (
      uid === uidActual
    ) {
      const nombre = [
        perfil?.nombre,
        perfil?.apellido
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      return (
        nombre ||
        user?.email ||
        'Usuario actual'
      );
    }

    return uid;
  };

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

  const exportarXLS = async () => {
    if (
      visitasMostradas.length === 0 ||
      exportando
    ) {
      return;
    }

    try {
      setExportando(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 50)
      );

      const datosExcel =
        visitasMostradas.map((visita) => ({
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
            visita.origen || 'web',

          'Registrado por':
            obtenerNombreRegistrador(
              visita
            )
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
        { wch: 14 },
        { wch: 32 }
      ];

      hoja['!autofilter'] = {
        ref:
          `A1:H${
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
    } catch (err) {
      console.error(
        'Error exportando historial:',
        err
      );

      alert(
        'No fue posible exportar el historial.'
      );
    } finally {
      setExportando(false);
    }
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

          {esOperador && (
            <p>
              Mostrando únicamente los registros
              realizados por tu usuario.
            </p>
          )}
        </div>

        <div className="botones historial-botones">
          <button
            type="button"
            className="boton-actualizar-historial"
            onClick={cargarVisitas}
            disabled={cargando || exportando}
          >
            {cargando
              ? 'Actualizando...'
              : 'Actualizar'}
          </button>

          <button
            type="button"
            className={
              exportando
                ? 'boton-exportar boton-exportando'
                : 'boton-exportar'
            }
            onClick={exportarXLS}
            disabled={
              visitasMostradas.length === 0 ||
              exportando ||
              cargando
            }
          >
            {exportando
              ? 'Exportando...'
              : 'Exportar XLSX'}
          </button>
        </div>
      </div>

      {esAdminEmpresa && (
        <section className="dashboard-filtros">
          <div className="campo-formulario">
            <label htmlFor="filtro-usuario-historial">
              Usuario que registró
            </label>

            <select
              id="filtro-usuario-historial"
              value={usuarioFiltro}
              onChange={(event) =>
                setUsuarioFiltro(
                  event.target.value
                )
              }
            >
              <option value="">
                Todos los usuarios
              </option>

              {opcionesUsuarios.map(
                (usuario) => (
                  <option
                    key={usuario.uid}
                    value={usuario.uid}
                  >
                    {usuario.nombre}
                  </option>
                )
              )}

              {existeVisitaSinUsuario && (
                <option
                  value={FILTRO_SIN_USUARIO}
                >
                  Sin usuario identificado
                </option>
              )}
            </select>
          </div>

          <div className="admin-contador">
            <strong>
              {visitasMostradas.length}
            </strong>

            {' '}

            {visitasMostradas.length === 1
              ? 'visita'
              : 'visitas'}
          </div>
        </section>
      )}

      {visitasMostradas.length === 0 ? (
        <div className="dashboard-sin-datos">
          No hay visitas registradas
          para el filtro seleccionado.
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

                {esAdminEmpresa && (
                  <th>
                    Registrado por
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {visitasMostradas.map(
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

                      {esAdminEmpresa && (
                        <td>
                          {obtenerNombreRegistrador(
                            visita
                          )}
                        </td>
                      )}
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
