import {
  useEffect,
  useMemo,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

import {
  crearEmpresa,
  normalizarCodigoEmpresa,
  obtenerEmpresas
} from '../../services/empresas';

const FORMULARIO_INICIAL = {
  nombre: '',
  codigo: '',
  email: '',
  telefono: '',
  direccion: '',
  idioma: 'es',
  zonaHoraria: 'America/Montevideo',
  horarioInicio: '09:00',
  horarioFin: '18:00',
  colorPrimario: '#2563EB',
  colorSecundario: '#1E40AF'
};

function EmpresasPage() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [empresas, setEmpresas] =
    useState([]);

  const [formulario, setFormulario] =
    useState(FORMULARIO_INICIAL);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const codigoVistaPrevia = useMemo(() => {
    return normalizarCodigoEmpresa(
      formulario.codigo || formulario.nombre
    );
  }, [
    formulario.codigo,
    formulario.nombre
  ]);

  const cargarEmpresas = async () => {
    try {
      setCargando(true);
      setError('');

      const datos = await obtenerEmpresas();
      setEmpresas(datos);
    } catch (err) {
      console.error(
        'Error cargando empresas:',
        err
      );

      setError(
        err.message ||
          'No fue posible cargar las empresas.'
      );
    } finally {
      setCargando(false);
    }
  };

  const actualizarCampo = (event) => {
    const { name, value } = event.target;

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: value
    }));
  };

  const abrirFormulario = () => {
    setFormulario(FORMULARIO_INICIAL);
    setError('');
    setMensaje('');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setFormulario(FORMULARIO_INICIAL);
    setError('');
  };

  const guardarEmpresa = async (event) => {
    event.preventDefault();

    setError('');
    setMensaje('');

    if (!formulario.nombre.trim()) {
      setError(
        'Debes ingresar el nombre de la empresa.'
      );
      return;
    }

    if (!codigoVistaPrevia) {
      setError(
        'El código de la empresa no es válido.'
      );
      return;
    }

    const empresaExistente = empresas.some(
      (empresa) =>
        empresa.id === codigoVistaPrevia
    );

    if (empresaExistente) {
      setError(
        'Ya existe una empresa con ese código.'
      );
      return;
    }

    try {
      setGuardando(true);

      await crearEmpresa({
        ...formulario,
        codigo: codigoVistaPrevia,
        creadaPor: perfil.uid
      });

      setMensaje(
        'La empresa fue creada correctamente.'
      );

      setMostrarFormulario(false);
      setFormulario(FORMULARIO_INICIAL);

      await cargarEmpresas();
    } catch (err) {
      console.error(
        'Error creando empresa:',
        err
      );

      setError(
        err.message ||
          'No fue posible crear la empresa.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-cabecera">
        <div>
          <button
            type="button"
            className="boton-volver"
            onClick={() =>
              navigate('/admin')
            }
          >
            ← Volver
          </button>

          <h1>Empresas</h1>

          <p>
            Crear y administrar empresas
            registradas en el sistema.
          </p>
        </div>

        <button
          type="button"
          className="boton-nueva-empresa"
          onClick={abrirFormulario}
        >
          Nueva empresa
        </button>
      </header>

      {mensaje && (
        <div className="mensaje-exito">
          {mensaje}
        </div>
      )}

      {error && !mostrarFormulario && (
        <div className="error admin-mensaje">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="dashboard-estado">
          Cargando empresas...
        </div>
      ) : empresas.length === 0 ? (
        <div className="admin-sin-datos">
          <h2>No hay empresas registradas</h2>

          <p>
            Pulsa “Nueva empresa” para crear
            la primera.
          </p>
        </div>
      ) : (
        <section className="empresas-grid">
          {empresas.map((empresa) => (
            <article
              key={empresa.id}
              className="empresa-card"
            >
              <div className="empresa-card-cabecera">
                <div>
                  <h2>
                    {empresa.nombre ||
                      empresa.id}
                  </h2>

                  <span className="empresa-codigo">
                    Código: {empresa.codigo ||
                      empresa.id}
                  </span>
                </div>

                <span
                  className={
                    empresa.activa
                      ? 'estado-activo'
                      : 'estado-inactivo'
                  }
                >
                  {empresa.activa
                    ? 'Activa'
                    : 'Inactiva'}
                </span>
              </div>

              <div className="empresa-card-acciones">
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      `La edición de ${empresa.nombre} se agregará después.`
                    )
                  }
                >
                  Editar
                </button>

                <button
  type="button"
  onClick={() =>
    navigate(
      `/admin/usuarios?empresa=${empresa.id}`
    )
  }
>
  Usuarios
</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {mostrarFormulario && (
        <div
          className="modal-fondo"
          role="presentation"
          onMouseDown={cerrarFormulario}
        >
          <div
            className="modal-empresa"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nueva-empresa"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-cabecera">
              <div>
                <h2 id="titulo-nueva-empresa">
                  Nueva empresa
                </h2>

                <p>
                  Completa los datos iniciales
                  de la empresa.
                </p>
              </div>

              <button
                type="button"
                className="boton-cerrar-modal"
                onClick={cerrarFormulario}
                disabled={guardando}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="error">
                {error}
              </div>
            )}

            <form
              className="formulario-empresa"
              onSubmit={guardarEmpresa}
            >
              <div className="campo-formulario campo-completo">
                <label htmlFor="nombre">
                  Nombre de la empresa
                </label>

                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formulario.nombre}
                  onChange={actualizarCampo}
                  maxLength={100}
                  required
                />
              </div>

              <div className="campo-formulario campo-completo">
                <label htmlFor="codigo">
                  Código identificador
                </label>

                <input
                  id="codigo"
                  name="codigo"
                  type="text"
                  value={formulario.codigo}
                  onChange={actualizarCampo}
                  maxLength={50}
                  placeholder="Se genera desde el nombre"
                />

                <small>
                  Código que se guardará:{' '}
                  <strong>
                    {codigoVistaPrevia ||
                      'sin código'}
                  </strong>
                </small>
              </div>

              <div className="campo-formulario">
                <label htmlFor="email">
                  Correo
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={actualizarCampo}
                  maxLength={120}
                />
              </div>

              <div className="campo-formulario">
                <label htmlFor="telefono">
                  Teléfono
                </label>

                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  value={formulario.telefono}
                  onChange={actualizarCampo}
                  maxLength={30}
                />
              </div>

              <div className="campo-formulario campo-completo">
                <label htmlFor="direccion">
                  Dirección
                </label>

                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  value={formulario.direccion}
                  onChange={actualizarCampo}
                  maxLength={150}
                />
              </div>

              <div className="campo-formulario">
                <label htmlFor="idioma">
                  Idioma
                </label>

                <select
                  id="idioma"
                  name="idioma"
                  value={formulario.idioma}
                  onChange={actualizarCampo}
                >
                  <option value="es">
                    Español
                  </option>

                  <option value="en">
                    Inglés
                  </option>
                </select>
              </div>

              <div className="campo-formulario">
                <label htmlFor="zonaHoraria">
                  Zona horaria
                </label>

                <select
                  id="zonaHoraria"
                  name="zonaHoraria"
                  value={formulario.zonaHoraria}
                  onChange={actualizarCampo}
                >
                  <option value="America/Montevideo">
                    Uruguay — Montevideo
                  </option>

                  <option value="America/Argentina/Buenos_Aires">
                    Argentina — Buenos Aires
                  </option>

                  <option value="America/Sao_Paulo">
                    Brasil — São Paulo
                  </option>

                  <option value="America/Santiago">
                    Chile — Santiago
                  </option>

                  <option value="America/Mexico_City">
                    México — Ciudad de México
                  </option>
                </select>
              </div>

              <div className="campo-formulario">
                <label htmlFor="horarioInicio">
                  Horario inicial
                </label>

                <input
                  id="horarioInicio"
                  name="horarioInicio"
                  type="time"
                  value={formulario.horarioInicio}
                  onChange={actualizarCampo}
                />
              </div>

              <div className="campo-formulario">
                <label htmlFor="horarioFin">
                  Horario final
                </label>

                <input
                  id="horarioFin"
                  name="horarioFin"
                  type="time"
                  value={formulario.horarioFin}
                  onChange={actualizarCampo}
                />
              </div>

              <div className="campo-formulario">
                <label htmlFor="colorPrimario">
                  Color principal
                </label>

                <input
                  id="colorPrimario"
                  name="colorPrimario"
                  type="color"
                  value={formulario.colorPrimario}
                  onChange={actualizarCampo}
                />
              </div>

              <div className="campo-formulario">
                <label htmlFor="colorSecundario">
                  Color secundario
                </label>

                <input
                  id="colorSecundario"
                  name="colorSecundario"
                  type="color"
                  value={formulario.colorSecundario}
                  onChange={actualizarCampo}
                />
              </div>

              <div className="modal-acciones campo-completo">
                <button
                  type="button"
                  className="boton-cancelar"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="boton-guardar"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Creando empresa...'
                    : 'Crear empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmpresasPage;