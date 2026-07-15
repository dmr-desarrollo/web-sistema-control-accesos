import { useEffect, useMemo, useState } from 'react';
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

import { obtenerVisitas } from '../services/visitas';

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
  const [visitas, setVisitas] = useState([]);

  /*
   * Fechas que el usuario escribe o selecciona.
   * Todavía no se aplican hasta pulsar "Aplicar rango".
   */
  const [fechaDesdeSeleccionada, setFechaDesdeSeleccionada] = useState('');
  const [fechaHastaSeleccionada, setFechaHastaSeleccionada] = useState('');

  /*
   * Fechas que realmente utiliza el Dashboard para filtrar.
   */
  const [fechaDesdeAplicada, setFechaDesdeAplicada] = useState('');
  const [fechaHastaAplicada, setFechaHastaAplicada] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      const data = await obtenerVisitas();
      setVisitas(data);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError(err.message || 'No fue posible cargar el dashboard');
    } finally {
      setCargando(false);
    }
  };

  /*
   * Convierte correctamente fechas de Firestore,
   * timestamps o fechas normales de JavaScript.
   */
  const convertirFecha = (fecha) => {
    if (!fecha) return null;

    if (typeof fecha.toDate === 'function') {
      return fecha.toDate();
    }

    if (fecha.seconds) {
      return new Date(fecha.seconds * 1000);
    }

    const resultado = new Date(fecha);

    return Number.isNaN(resultado.getTime())
      ? null
      : resultado;
  };

  /*
   * Crea una fecha local sin que UTC cambie el día.
   */
  const crearFechaLocal = (valor, finDelDia = false) => {
    if (!valor) return null;

    const [anio, mes, dia] = valor
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

  /*
   * Solo filtra usando las fechas aplicadas.
   */
  const visitasFiltradas = useMemo(() => {
    const desde = crearFechaLocal(
      fechaDesdeAplicada,
      false
    );

    const hasta = crearFechaLocal(
      fechaHastaAplicada,
      true
    );

    return visitas.filter((visita) => {
      const fechaVisita = convertirFecha(
        visita.fecha
      );

      if (!fechaVisita) return false;

      if (desde && fechaVisita < desde) {
        return false;
      }

      if (hasta && fechaVisita > hasta) {
        return false;
      }

      return true;
    });
  }, [
    visitas,
    fechaDesdeAplicada,
    fechaHastaAplicada
  ]);

  const agruparPorCampo = (campo) => {
    const acumulado = {};

    visitasFiltradas.forEach((visita) => {
      const valor =
        visita[campo]?.trim() || 'Sin dato';

      acumulado[valor] =
        (acumulado[valor] || 0) + 1;
    });

    return Object.entries(acumulado)
      .map(([nombre, total]) => ({
        nombre,
        total
      }))
      .sort((a, b) => b.total - a.total);
  };

  const visitasPorEmpresa = useMemo(() => {
    return agruparPorCampo('empresa');
  }, [visitasFiltradas]);

  const personasVisitadas = useMemo(() => {
    return agruparPorCampo(
      'personaVisitableNombre'
    );
  }, [visitasFiltradas]);

  /*
   * Solo muestra las cinco personas más visitadas.
   * Se excluye "Sin dato".
   */
  const topPersonasVisitadas = useMemo(() => {
    return personasVisitadas
      .filter(
        (persona) =>
          persona.nombre !== 'Sin dato'
      )
      .slice(0, 5);
  }, [personasVisitadas]);

  const visitasPorDia = useMemo(() => {
    const acumulado = {};

    visitasFiltradas.forEach((visita) => {
      const fecha = convertirFecha(
        visita.fecha
      );

      if (!fecha) return;

      const claveOrden = [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(
          2,
          '0'
        ),
        String(fecha.getDate()).padStart(
          2,
          '0'
        )
      ].join('-');

      if (!acumulado[claveOrden]) {
        acumulado[claveOrden] = {
          fechaTexto:
            fecha.toLocaleDateString('es-UY', {
              day: '2-digit',
              month: '2-digit'
            }),
          total: 0
        };
      }

      acumulado[claveOrden].total += 1;
    });

    return Object.entries(acumulado)
      .sort(([fechaA], [fechaB]) =>
        fechaA.localeCompare(fechaB)
      )
      .map(([, datos]) => ({
        fecha: datos.fechaTexto,
        total: datos.total
      }));
  }, [visitasFiltradas]);

  /*
   * Aplica el rango elegido manualmente.
   */
  const aplicarRango = () => {
    if (
      fechaDesdeSeleccionada &&
      fechaHastaSeleccionada &&
      fechaDesdeSeleccionada >
        fechaHastaSeleccionada
    ) {
      alert(
        'La fecha desde no puede ser posterior a la fecha hasta.'
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
  };

  /*
   * Convierte una fecha JavaScript a AAAA-MM-DD
   * respetando la zona horaria local.
   */
  const formatearFechaInput = (fecha) => {
    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  };

  const filtrarHoy = () => {
    const hoy = formatearFechaInput(
      new Date()
    );

    setFechaDesdeSeleccionada(hoy);
    setFechaHastaSeleccionada(hoy);
    setFechaDesdeAplicada(hoy);
    setFechaHastaAplicada(hoy);
  };

  const filtrarSemana = () => {
    const hoy = new Date();
    const desde = new Date();

    desde.setDate(hoy.getDate() - 6);

    const desdeTexto =
      formatearFechaInput(desde);

    const hastaTexto =
      formatearFechaInput(hoy);

    setFechaDesdeSeleccionada(desdeTexto);
    setFechaHastaSeleccionada(hastaTexto);
    setFechaDesdeAplicada(desdeTexto);
    setFechaHastaAplicada(hastaTexto);
  };

  const filtrarMes = () => {
    const hoy = new Date();

    const primerDia = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    const desdeTexto =
      formatearFechaInput(primerDia);

    const hastaTexto =
      formatearFechaInput(hoy);

    setFechaDesdeSeleccionada(desdeTexto);
    setFechaHastaSeleccionada(hastaTexto);
    setFechaDesdeAplicada(desdeTexto);
    setFechaHastaAplicada(hastaTexto);
  };

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
        Error: {error}
      </div>
    );
  }

  return (
    <div className="dashboard dashboard-mejorado">
      {/* Título central */}
      <div className="dashboard-cabecera">
        <h1>Panel de visitas</h1>

        <button
          type="button"
          className="boton-actualizar"
          onClick={cargarDatos}
        >
          Actualizar datos
        </button>
      </div>

      {/* Rango de fechas */}
      <section className="dashboard-filtros">
        <div className="filtro-fecha">
          <label htmlFor="fecha-desde">
            Fecha inicial
          </label>

          <input
            id="fecha-desde"
            type="date"
            value={fechaDesdeSeleccionada}
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
            value={fechaHastaSeleccionada}
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

      {/* Indicadores */}
      <section className="dashboard-indicadores">
        <article className="indicador">
          <span>Total de visitas</span>
          <strong>
            {visitasFiltradas.length}
          </strong>
        </article>

        <article className="indicador">
          <span>Empresas diferentes</span>

          <strong>
            {
              visitasPorEmpresa.filter(
                (empresa) =>
                  empresa.nombre !== 'Sin dato'
              ).length
            }
          </strong>
        </article>

        <article className="indicador">
          <span>Personas visitadas</span>

          <strong>
            {
              personasVisitadas.filter(
                (persona) =>
                  persona.nombre !== 'Sin dato'
              ).length
            }
          </strong>
        </article>
      </section>

      {visitasFiltradas.length === 0 ? (
        <div className="dashboard-sin-datos">
          No hay visitas para el período
          seleccionado.
        </div>
      ) : (
        <section className="dashboard-graficos">
          {/* Visitas por empresa */}
          <article className="grafico-card grafico-ancho">
            <h2>Visitas por empresa</h2>

            <div className="grafico-contenedor">
              <ResponsiveContainer
                width="100%"
                height={340}
              >
                <BarChart
                  data={visitasPorEmpresa.slice(
                    0,
                    12
                  )}
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

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="total"
                    name="Cantidad de visitas"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Top cinco personas */}
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
          data={topPersonasVisitadas}
          dataKey="total"
          nameKey="nombre"
          cx="38%"
          cy="50%"
          innerRadius={38}
          outerRadius={88}
          paddingAngle={3}
          labelLine={false}
          label={renderNumeroDentroTorta}
        >
          {topPersonasVisitadas.map(
            (item, index) => (
              <Cell
                key={`${item.nombre}-${index}`}
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
            propiedades.payload.nombre
          ]}
        />

        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="square"
          wrapperStyle={{
            width: '45%',
            lineHeight: '30px',
            paddingLeft: '8px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
</article>

          {/* Visitas por día */}
          <article className="grafico-card">
            <h2>Visitas por día</h2>

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

                  <XAxis dataKey="fecha" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Bar
                    dataKey="total"
                    name="Visitas"
                    fill="#16a34a"
                    radius={[6, 6, 0, 0]}
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