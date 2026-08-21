import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { useAuth } from '../hooks/useAuth';
import { obtenerVisitas } from '../services/visitas';
import { listarUsuarios } from '../services/usuarios';

const COLORES_TORTA = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#7c3aed'
];

const RADIAN = Math.PI / 180;

const renderNumeroDentroTorta = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  value
}) => {
  const radio =
    innerRadius +
    (outerRadius - innerRadius) * 0.55;

  const x =
    cx +
    radio *
      Math.cos(-midAngle * RADIAN);

  const y =
    cy +
    radio *
      Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="14"
      fontWeight="700"
      stroke="rgba(0,0,0,0.25)"
      strokeWidth="0.5"
    >
      {value}
    </text>
  );
};

function Dashboard() {
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

  /*
   * Fechas seleccionadas por el usuario.
   * No se aplican hasta pulsar "Aplicar rango".
   */
  const [
    fechaDesdeSeleccionada,
    setFechaDesdeSeleccionada
  ] = useState('');

  const [
    fechaHastaSeleccionada,
    setFechaHastaSeleccionada
  ] = useState('');

  /*
   * Fechas aplicadas realmente al Dashboard.
   */
  const [
    fechaDesdeAplicada,
    setFechaDesdeAplicada
  ] = useState('');

  const [
    fechaHastaAplicada,
    setFechaHastaAplicada
  ] = useState('');

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
   * Carga datos según el rol:
   *
   * operador:
   * - solamente sus propias visitas.
   *
   * admin_empresa:
   * - todas las visitas de su empresa;
   * - usuarios de la empresa para filtrar.
   */
  const cargarDatos = useCallback(async () => {
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

      setVisitas(datosVisitas);
      setUsuariosEmpresa(
        datosUsuarios
      );
    } catch (err) {
      console.error(
        'Error cargando dashboard:',
        err
      );

      setError(
        err.message ||
          'No fue posible cargar el dashboard.'
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
    cargarDatos();
  }, [
    cargarDatos
  ]);

  /*
   * Convierte fechas de Firestore, timestamps
   * o fechas normales de JavaScript.
   */
  const convertirFecha = (fecha) => {
    if (!fecha) {
      return null;
    }

    if (
      typeof fecha.toDate ===
      'function'
    ) {
      return fecha.toDate();
    }

    if (fecha.seconds) {
      return new Date(
        fecha.seconds * 1000
      );
    }

    const resultado =
      new Date(fecha);

    return Number.isNaN(
      resultado.getTime()
    )
      ? null
      : resultado;
  };

  /*
   * Crea fechas locales sin que UTC
   * cambie el día seleccionado.
   */
  const crearFechaLocal = (
    valor,
    finDelDia = false
  ) => {
    if (!valor) {
      return null;
    }

    const [
      anio,
      mes,
      dia
    ] = valor
      .split('-')
      .map(Number);

    if (finDelDia) {
      return new Date(
        anio,
        mes - 1,
        dia,
        23,
        59,
        59,
        999
      );
    }

    return new Date(
      anio,
      mes - 1,
      dia,
      0,
      0,
      0,
      0
    );
  };

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

  /*
   * Filtra las visitas utilizando las
   * fechas que fueron aplicadas.
   */
  const visitasFiltradas = useMemo(() => {
    const desde =
      crearFechaLocal(
        fechaDesdeAplicada,
        false
      );

    const hasta =
      crearFechaLocal(
        fechaHastaAplicada,
        true
      );

    return visitas.filter(
      (visita) => {
        const fechaVisita =
          convertirFecha(
            visita.fecha
          );

        if (!fechaVisita) {
          return false;
        }

        if (
          desde &&
          fechaVisita < desde
        ) {
          return false;
        }

        if (
          hasta &&
          fechaVisita > hasta
        ) {
          return false;
        }

        if (
          esAdminEmpresa &&
          usuarioFiltro
        ) {
          const uidVisita =
            String(
              visita.creadoPorUid || ''
            ).trim();

          if (
            usuarioFiltro ===
            '__sin_usuario__'
          ) {
            return !uidVisita;
          }

          return (
            uidVisita ===
            usuarioFiltro
          );
        }

        return true;
      }
    );
  }, [
    visitas,
    fechaDesdeAplicada,
    fechaHastaAplicada,
    esAdminEmpresa,
    usuarioFiltro
  ]);

  const agruparPorCampo = (
    campo
  ) => {
    const acumulado = {};

    visitasFiltradas.forEach(
      (visita) => {
        const valor =
          String(
            visita[campo] ||
            ''
          ).trim() ||
          'Sin dato';

        acumulado[valor] =
          (acumulado[valor] || 0) +
          1;
      }
    );

    return Object
      .entries(acumulado)
      .map(
        ([nombre, total]) => ({
          nombre,
          total
        })
      )
      .sort(
        (a, b) =>
          b.total - a.total
      );
  };

  /*
   * Los documentos nuevos utilizan
   * empresaNombre y empresaId.
   *
   * visita.empresa se conserva como
   * compatibilidad temporal con datos antiguos.
   */
  const visitasPorEmpresa =
    useMemo(() => {
      const acumulado = {};

      visitasFiltradas.forEach(
        (visita) => {
          const nombreEmpresa =
            String(
              visita.empresaNombre ||
              visita.empresa ||
              perfil?.empresaNombre ||
              perfil?.empresaId ||
              ''
            ).trim() ||
            'Sin dato';

          acumulado[nombreEmpresa] =
            (
              acumulado[
                nombreEmpresa
              ] || 0
            ) + 1;
        }
      );

      return Object
        .entries(acumulado)
        .map(
          ([nombre, total]) => ({
            nombre,
            total
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        );
    }, [
      visitasFiltradas,
      perfil?.empresaId,
      perfil?.empresaNombre
    ]);

  const personasVisitadas =
    useMemo(() => {
      return agruparPorCampo(
        'personaVisitableNombre'
      );
    }, [
      visitasFiltradas
    ]);

  /*
   * Muestra las cinco personas
   * más visitadas.
   */
  const topPersonasVisitadas =
    useMemo(() => {
      return personasVisitadas
        .filter(
          (persona) =>
            persona.nombre !==
            'Sin dato'
        )
        .slice(0, 5);
    }, [
      personasVisitadas
    ]);

  const visitasPorUsuario =
    useMemo(() => {
      if (!esAdminEmpresa) {
        return [];
      }

      const acumulado = {};

      visitasFiltradas.forEach(
        (visita) => {
          const nombre =
            obtenerNombreRegistrador(
              visita
            );

          acumulado[nombre] =
            (acumulado[nombre] || 0) +
            1;
        }
      );

      return Object
        .entries(acumulado)
        .map(
          ([nombre, total]) => ({
            nombre,
            total
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        );
    }, [
      visitasFiltradas,
      esAdminEmpresa,
      mapaUsuarios
    ]);

  const visitasPorDia =
    useMemo(() => {
      const acumulado = {};

      visitasFiltradas.forEach(
        (visita) => {
          const fecha =
            convertirFecha(
              visita.fecha
            );

          if (!fecha) {
            return;
          }

          const claveOrden = [
            fecha.getFullYear(),
            String(
              fecha.getMonth() + 1
            ).padStart(2, '0'),
            String(
              fecha.getDate()
            ).padStart(2, '0')
          ].join('-');

          if (
            !acumulado[
              claveOrden
            ]
          ) {
            acumulado[
              claveOrden
            ] = {
              fechaTexto:
                fecha.toLocaleDateString(
                  'es-UY',
                  {
                    day: '2-digit',
                    month: '2-digit'
                  }
                ),
              total: 0
            };
          }

          acumulado[
            claveOrden
          ].total += 1;
        }
      );

      return Object
        .entries(acumulado)
        .sort(
          ([fechaA], [fechaB]) =>
            fechaA.localeCompare(
              fechaB
            )
        )
        .map(
          ([, datos]) => ({
            fecha:
              datos.fechaTexto,
            total:
              datos.total
          })
        );
    }, [
      visitasFiltradas
    ]);

  const aplicarRango = () => {
    if (
      fechaDesdeSeleccionada &&
      fechaHastaSeleccionada &&
      fechaDesdeSeleccionada >
        fechaHastaSeleccionada
    ) {
      alert(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );

      return;
    }

    setFechaDesdeAplicada(
      fechaDesdeSeleccionada
    );

    setFechaHastaAplicada(
      fechaHastaSeleccionada
    );
  };

  const limpiarFiltros = () => {
    setFechaDesdeSeleccionada('');
    setFechaHastaSeleccionada('');
    setFechaDesdeAplicada('');
    setFechaHastaAplicada('');
    setUsuarioFiltro('');
  };

  /*
   * Convierte una fecha JavaScript
   * al formato AAAA-MM-DD.
   */
  const formatearFechaInput = (
    fecha
  ) => {
    const anio =
      fecha.getFullYear();

    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        fecha.getDate()
      ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  };

  const filtrarHoy = () => {
    const hoy =
      formatearFechaInput(
        new Date()
      );

    setFechaDesdeSeleccionada(
      hoy
    );

    setFechaHastaSeleccionada(
      hoy
    );

    setFechaDesdeAplicada(
      hoy
    );

    setFechaHastaAplicada(
      hoy
    );
  };

  const filtrarSemana = () => {
    const hoy = new Date();
    const desde = new Date();

    desde.setDate(
      hoy.getDate() - 6
    );

    const desdeTexto =
      formatearFechaInput(
        desde
      );

    const hastaTexto =
      formatearFechaInput(
        hoy
      );

    setFechaDesdeSeleccionada(
      desdeTexto
    );

    setFechaHastaSeleccionada(
      hastaTexto
    );

    setFechaDesdeAplicada(
      desdeTexto
    );

    setFechaHastaAplicada(
      hastaTexto
    );
  };

  const filtrarMes = () => {
    const hoy = new Date();

    const primerDia =
      new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      );

    const desdeTexto =
      formatearFechaInput(
        primerDia
      );

    const hastaTexto =
      formatearFechaInput(
        hoy
      );

    setFechaDesdeSeleccionada(
      desdeTexto
    );

    setFechaHastaSeleccionada(
      hastaTexto
    );

    setFechaDesdeAplicada(
      desdeTexto
    );

    setFechaHastaAplicada(
      hastaTexto
    );
  };

  const nombreEmpresa =
    perfil?.empresaNombre ||
    perfil?.empresaId ||
    'Sin empresa asignada';

  if (cargando) {
    return (
      <div className="dashboard-estado">
        Cargando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-estado dashboard-error">
        <h2>
          No se pudo cargar el panel
        </h2>

        <p>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard dashboard-mejorado">
      <div className="dashboard-cabecera">
        <div>
          <h1>
            Panel de visitas
          </h1>

          <p>
            Empresa:{' '}
            <strong>
              {nombreEmpresa}
            </strong>
          </p>

          {esOperador && (
            <p>
              Mostrando únicamente tus registros.
            </p>
          )}
        </div>

        <button
          type="button"
          className="boton-actualizar"
          onClick={cargarDatos}
        >
          Actualizar datos
        </button>
      </div>

      <section className="dashboard-filtros">
        {esAdminEmpresa && (
          <div className="filtro-fecha">
            <label htmlFor="filtro-usuario-dashboard">
              Usuario que registró
            </label>

            <select
              id="filtro-usuario-dashboard"
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
                <option value="__sin_usuario__">
                  Sin usuario identificado
                </option>
              )}
            </select>
          </div>
        )}
        <div className="filtro-fecha">
          <label htmlFor="fecha-desde">
            Fecha inicial
          </label>

          <input
            id="fecha-desde"
            type="date"
            value={
              fechaDesdeSeleccionada
            }
            onChange={(event) =>
              setFechaDesdeSeleccionada(
                event.target.value
              )
            }
          />
        </div>

        <div className="filtro-fecha">
          <label htmlFor="fecha-hasta">
            Fecha final
          </label>

          <input
            id="fecha-hasta"
            type="date"
            value={
              fechaHastaSeleccionada
            }
            onChange={(event) =>
              setFechaHastaSeleccionada(
                event.target.value
              )
            }
          />
        </div>

        <div className="filtros-rapidos">
          <button
            type="button"
            onClick={aplicarRango}
          >
            Aplicar rango
          </button>

          <button
            type="button"
            onClick={filtrarHoy}
          >
            Visitas de hoy
          </button>

          <button
            type="button"
            onClick={filtrarSemana}
          >
            Últimos 7 días
          </button>

          <button
            type="button"
            onClick={filtrarMes}
          >
            Mes actual
          </button>

          <button
            type="button"
            onClick={limpiarFiltros}
          >
            Mostrar todo
          </button>
        </div>
      </section>

      <section className="dashboard-indicadores">
        <article className="indicador">
          <span>
            Total de visitas
          </span>

          <strong>
            {visitasFiltradas.length}
          </strong>
        </article>

        <article className="indicador">
          <span>
            Empresas representadas
          </span>

          <strong>
            {
              visitasPorEmpresa.filter(
                (empresa) =>
                  empresa.nombre !==
                  'Sin dato'
              ).length
            }
          </strong>
        </article>

        <article className="indicador">
          <span>
            Personas visitadas
          </span>

          <strong>
            {
              personasVisitadas.filter(
                (persona) =>
                  persona.nombre !==
                  'Sin dato'
              ).length
            }
          </strong>
        </article>
      </section>

      {visitasFiltradas.length === 0 ? (
        <div className="dashboard-sin-datos">
          No hay visitas registradas para
          esta empresa en el período
          seleccionado.
        </div>
      ) : (
        <section className="dashboard-graficos">
          <article className="grafico-card grafico-ancho">
            <h2>
              Visitas de la empresa
            </h2>

            <div className="grafico-contenedor">
              <ResponsiveContainer
                width="100%"
                height={340}
              >
                <BarChart
                  data={
                    visitasPorEmpresa.slice(
                      0,
                      12
                    )
                  }
                  margin={{
                    top: 20,
                    right: 25,
                    left: 0,
                    bottom: 75
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="nombre"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={90}
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="total"
                    name="Cantidad de visitas"
                    fill="#2563eb"
                    radius={[
                      6,
                      6,
                      0,
                      0
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="grafico-card">
            <h2>
              Top 5 personas más visitadas
            </h2>

            <div className="grafico-contenedor">
              <ResponsiveContainer
                width="100%"
                height={360}
              >
                <PieChart>
                  <Pie
                    data={
                      topPersonasVisitadas
                    }
                    dataKey="total"
                    nameKey="nombre"
                    cx="38%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={88}
                    paddingAngle={3}
                    labelLine={false}
                    label={
                      renderNumeroDentroTorta
                    }
                  >
                    {topPersonasVisitadas.map(
                      (
                        item,
                        index
                      ) => (
                        <Cell
                          key={
                            `${item.nombre}-${index}`
                          }
                          fill={
                            COLORES_TORTA[
                              index %
                                COLORES_TORTA.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(
                      valor,
                      nombre,
                      propiedades
                    ) => [
                      `${valor} visitas`,
                      propiedades
                        .payload
                        .nombre
                    ]}
                  />

                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="square"
                    wrapperStyle={{
                      width: '45%',
                      lineHeight:
                        '30px',
                      paddingLeft:
                        '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          {esAdminEmpresa && (
            <article className="grafico-card grafico-ancho">
              <h2>
                Visitas por usuario
              </h2>

              <div className="grafico-contenedor">
                <ResponsiveContainer
                  width="100%"
                  height={340}
                >
                  <BarChart
                    data={visitasPorUsuario}
                    margin={{
                      top: 20,
                      right: 25,
                      left: 0,
                      bottom: 75
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="nombre"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      height={90}
                    />

                    <YAxis
                      allowDecimals={false}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="total"
                      name="Visitas registradas"
                      fill="#7c3aed"
                      radius={[
                        6,
                        6,
                        0,
                        0
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          )}

          <article className="grafico-card">
            <h2>
              Visitas por día
            </h2>

            <div className="grafico-contenedor">
              <ResponsiveContainer
                width="100%"
                height={340}
              >
                <BarChart
                  data={visitasPorDia}
                  margin={{
                    top: 20,
                    right: 25,
                    left: 0,
                    bottom: 25
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="fecha"
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="total"
                    name="Visitas"
                    fill="#16a34a"
                    radius={[
                      6,
                      6,
                      0,
                      0
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
