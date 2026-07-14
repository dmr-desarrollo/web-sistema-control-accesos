import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { obtenerVisitas } from '../services/visitas';

function Dashboard() {
  const { user } = useAuth();
  const [visitas, setVisitas] = useState([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    const data = await obtenerVisitas();
    setVisitas(data);
    setCargando(false);
  };

  const convertirFecha = (fecha) => {
    if (!fecha) return null;
    if (fecha.seconds) return new Date(fecha.seconds * 1000);
    return new Date(fecha);
  };

  const visitasFiltradas = useMemo(() => {
    return visitas.filter((v) => {
      const fecha = convertirFecha(v.fecha);
      if (!fecha) return false;

      if (fechaDesde) {
        const desde = new Date(fechaDesde);
        desde.setHours(0, 0, 0, 0);
        if (fecha < desde) return false;
      }

      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        if (fecha > hasta) return false;
      }

      return true;
    });
  }, [visitas, fechaDesde, fechaHasta]);

  const contarPorCampo = (campo) => {
    const resumen = {};

    visitasFiltradas.forEach((v) => {
      const clave = v[campo] || 'Sin dato';
      resumen[clave] = (resumen[clave] || 0) + 1;
    });

    return Object.entries(resumen)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  };

  const personasVisitadas = contarPorCampo('personaVisitableNombre');
  const empresas = contarPorCampo('empresa');

  if (cargando) return <div>Cargando dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard Control de Visitas</h1>
      <p>Bienvenido, {user?.email}</p>

      <div className="filtros-dashboard">
        <label>
          Desde:
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </label>

        <label>
          Hasta:
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </label>

        <button onClick={() => {
          setFechaDesde('');
          setFechaHasta('');
        }}>
          Limpiar filtros
        </button>
      </div>

      <div className="resumen-dashboard">
        <div>
          <h3>Total visitas</h3>
          <strong>{visitasFiltradas.length}</strong>
        </div>

        <div>
          <h3>Empresas distintas</h3>
          <strong>{empresas.length}</strong>
        </div>

        <div>
          <h3>Personas visitadas</h3>
          <strong>{personasVisitadas.length}</strong>
        </div>
      </div>

      <h2>Personas más visitadas</h2>
      <table>
        <thead>
          <tr>
            <th>Persona visitada</th>
            <th>Total visitas</th>
          </tr>
        </thead>
        <tbody>
          {personasVisitadas.map((item) => (
            <tr key={item.nombre}>
              <td>{item.nombre}</td>
              <td>{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Visitas por empresa</h2>
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Total visitas</th>
          </tr>
        </thead>
        <tbody>
          {empresas.map((item) => (
            <tr key={item.nombre}>
              <td>{item.nombre}</td>
              <td>{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;