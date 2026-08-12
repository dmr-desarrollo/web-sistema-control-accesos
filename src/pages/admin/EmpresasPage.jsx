import {
  useEffect,
  useMemo,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import ConfirmacionModal from '../../components/usuarios/ConfirmacionModal';

import { useAuth } from '../../hooks/useAuth';

import {
  actualizarEmpresa,
  cambiarEstadoEmpresa,
  crearEmpresa,
  normalizarCodigoEmpresa,
  obtenerEmpresaPorId,
  obtenerEmpresas
} from '../../services/empresas';

const FORMULARIO_INICIAL = {
  id: '',
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

  const [modoFormulario, setModoFormulario] =
    useState('crear');

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [
    empresaProcesando,
    setEmpresaProcesando
  ] = useState(null);

  const [
    empresaConfirmacion,
    setEmpresaConfirmacion
  ] = useState(null);

  const [
    mostrarConfirmacion,
    setMostrarConfirmacion
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const esEdicion =
    modoFormulario === 'editar';

  const codigoVistaPrevia = useMemo(() => {
    if (esEdicion) {
      return formulario.id;
    }

    return normalizarCodigoEmpresa(
      formulario.codigo ||
      formulario.nombre
    );
  }, [
    esEdicion,
    formulario.id,
    formulario.codigo,
    formulario.nombre
  ]);

  const cargarEmpresas = async () => {
    try {
      setCargando(true);
      setError('');

      const datos =
        await obtenerEmpresas();

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
    const {
      name,
      value
    } = event.target;

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: value
    }));
  };

  const abrirFormularioCrear = () => {
    setModoFormulario('crear');
    setFormulario(FORMULARIO_INICIAL);
    setError('');
    setMensaje('');
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = async (
    empresa
  ) => {
    try {
      setEmpresaProcesando(
        empresa.id
      );

      setError('');
      setMensaje('');

      const detalle =
        await obtenerEmpresaPorId(
          empresa.id
        );

      setModoFormulario('editar');

      setFormulario({
        id: detalle.id,
        nombre:
          detalle.nombre || '',
        codigo:
          detalle.codigo ||
          detalle.id,
        email:
          detalle.email || '',
        telefono:
          detalle.telefono || '',
        direccion:
          detalle.direccion || '',
        idioma:
          detalle.idioma || 'es',
        zonaHoraria:
          detalle.zonaHoraria ||
          'America/Montevideo',
        horarioInicio:
          detalle.horarioInicio ||
          '09:00',
        horarioFin:
          detalle.horarioFin ||
          '18:00',
        colorPrimario:
          detalle.colorPrimario ||
          '#2563EB',
        colorSecundario:
          detalle.colorSecundario ||
          '#1E40AF'
      });

      setMostrarFormulario(true);
    } catch (err) {
      console.error(
        'Error cargando empresa:',
        err
      );

      setError(
        err.message ||
          'No fue posible cargar la empresa seleccionada.'
      );
    } finally {
      setEmpresaProcesando(null);
    }
  };

  const cerrarFormulario = () => {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setModoFormulario('crear');
    setFormulario(FORMULARIO_INICIAL);
    setError('');
  };

  const guardarEmpresa = async (event) => {
    event.preventDefault();

    setError('');
    setMensaje('');

    const nombre =
      formulario.nombre.trim();

    if (!nombre) {
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

    if (!perfil?.uid) {
      setError(
        'No fue posible identificar al administrador.'
      );

      return;
    }

    if (!esEdicion) {
      const empresaExistente =
        empresas.some(
          (empresa) =>
            empresa.id ===
            codigoVistaPrevia
        );

      if (empresaExistente) {
        setError(
          'Ya existe una empresa con ese código.'
        );

        return;
      }
    }

    try {
      setGuardando(true);

      if (esEdicion) {
        await actualizarEmpresa({
          id: formulario.id,
          nombre,
          email: formulario.email,
          telefono:
            formulario.telefono,
          direccion:
            formulario.direccion,
          idioma:
            formulario.idioma,
          zonaHoraria:
            formulario.zonaHoraria,
          horarioInicio:
            formulario.horarioInicio,
          horarioFin:
            formulario.horarioFin,
          colorPrimario:
            formulario.colorPrimario,
          colorSecundario:
            formulario.colorSecundario,
          actualizadaPor:
            perfil.uid
        });
      } else {
        await crearEmpresa({
          ...formulario,
          nombre,
          codigo:
            codigoVistaPrevia,
          creadaPor:
            perfil.uid
        });
      }

      setMostrarFormulario(false);
      setModoFormulario('crear');
      setFormulario(
        FORMULARIO_INICIAL
      );

      await cargarEmpresas();

      setMensaje(
        esEdicion
          ? 'La empresa fue actualizada correctamente.'
          : 'La empresa fue creada correctamente.'
      );
    } catch (err) {
      console.error(
        esEdicion
          ? 'Error actualizando empresa:'
          : 'Error creando empresa:',
        err
      );

      setError(
        err.message ||
          (
            esEdicion
              ? 'No fue posible actualizar la empresa.'
              : 'No fue posible crear la empresa.'
          )
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirConfirmacionEstado = (
    empresa
  ) => {
    setEmpresaConfirmacion(
      empresa
    );

    setError('');
    setMensaje('');
    setMostrarConfirmacion(true);
  };

  const cerrarConfirmacionEstado = () => {
    if (empresaProcesando) {
      return;
    }

    setMostrarConfirmacion(false);
    setEmpresaConfirmacion(null);
  };

  const confirmarCambioEstado = async () => {
    if (!empresaConfirmacion?.id) {
      setMostrarConfirmacion(false);

      setError(
        'No fue posible identificar la empresa seleccionada.'
      );

      return;
    }

    if (!perfil?.uid) {
      setMostrarConfirmacion(false);

      setError(
        'No fue posible identificar al administrador.'
      );

      return;
    }

    const nuevoEstado =
      empresaConfirmacion.activa !== true;

    try {
      setEmpresaProcesando(
        empresaConfirmacion.id
      );

      setError('');
      setMensaje('');

      await cambiarEstadoEmpresa({
        id:
          empresaConfirmacion.id,
        activa:
          nuevoEstado,
        actualizadaPor:
          perfil.uid
      });

      await cargarEmpresas();

      setMostrarConfirmacion(false);
      setEmpresaConfirmacion(null);

      setMensaje(
        nuevoEstado
          ? 'La empresa fue activada correctamente.'
          : 'La empresa fue desactivada correctamente.'
      );
    } catch (err) {
      console.error(
        'Error cambiando estado de la empresa:',
        err
      );

      setError(
        err.message ||
          'No fue posible cambiar el estado de la empresa.'
      );
    } finally {
      setEmpresaProcesando(null);
    }
  };

  const confirmacionEsDesactivacion =
    empresaConfirmacion?.activa === true;

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
          onClick={
            abrirFormularioCrear
          }
          disabled={cargando}
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
          <h2>
            No hay empresas registradas
          </h2>

          <p>
            Pulsa “Nueva empresa” para crear
            la primera.
          </p>
        </div>
      ) : (
        <section className="empresas-grid">
          {empresas.map((empresa) => {
            const procesando =
              empresaProcesando ===
              empresa.id;

            const estaActiva =
              empresa.activa === true;

            return (
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
                      Código:{' '}
                      {empresa.codigo ||
                        empresa.id}
                    </span>
                  </div>

                  <span
                    className={
                      estaActiva
                        ? 'estado-activo'
                        : 'estado-inactivo'
                    }
                  >
                    {estaActiva
                      ? 'Activa'
                      : 'Inactiva'}
                  </span>
                </div>

                <div className="empresa-card-acciones">
                  <button
                    type="button"
                    onClick={() =>
                      abrirFormularioEditar(
                        empresa
                      )
                    }
                    disabled={procesando}
                  >
                    {procesando
                      ? 'Cargando...'
                      : 'Editar'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/usuarios?empresa=${empresa.id}`
                      )
                    }
                    disabled={procesando}
                  >
                    Usuarios
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      abrirConfirmacionEstado(
                        empresa
                      )
                    }
                    disabled={procesando}
                  >
                    {procesando
                      ? 'Procesando...'
                      : estaActiva
                        ? 'Desactivar'
                        : 'Activar'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {mostrarFormulario && (
        <div
          className="modal-fondo"
          role="presentation"
          onMouseDown={
            cerrarFormulario
          }
        >
          <div
            className="modal-empresa"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-empresa"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-cabecera">
              <div>
                <h2 id="titulo-empresa">
                  {esEdicion
                    ? 'Editar empresa'
                    : 'Nueva empresa'}
                </h2>

                <p>
                  {esEdicion
                    ? 'Modifica la configuración de la empresa seleccionada.'
                    : 'Completa los datos iniciales de la empresa.'}
                </p>
              </div>

              <button
                type="button"
                className="boton-cerrar-modal"
                onClick={
                  cerrarFormulario
                }
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
              onSubmit={
                guardarEmpresa
              }
            >
              <div className="campo-formulario campo-completo">
                <label htmlFor="nombre">
                  Nombre de la empresa
                </label>

                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={
                    formulario.nombre
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.codigo
                  }
                  onChange={
                    actualizarCampo
                  }
                  maxLength={50}
                  placeholder="Se genera desde el nombre"
                  disabled={
                    esEdicion ||
                    guardando
                  }
                />

                <small>
                  {esEdicion
                    ? 'El código no puede modificarse porque identifica la empresa y sus datos relacionados.'
                    : (
                      <>
                        Código que se guardará:{' '}
                        <strong>
                          {codigoVistaPrevia ||
                            'sin código'}
                        </strong>
                      </>
                    )}
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
                  value={
                    formulario.email
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.telefono
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.direccion
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.idioma
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.zonaHoraria
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.horarioInicio
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.horarioFin
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.colorPrimario
                  }
                  onChange={
                    actualizarCampo
                  }
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
                  value={
                    formulario.colorSecundario
                  }
                  onChange={
                    actualizarCampo
                  }
                />
              </div>

              <div className="modal-acciones campo-completo">
                <button
                  type="button"
                  className="boton-cancelar"
                  onClick={
                    cerrarFormulario
                  }
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
                    ? (
                      esEdicion
                        ? 'Guardando cambios...'
                        : 'Creando empresa...'
                    )
                    : (
                      esEdicion
                        ? 'Guardar cambios'
                        : 'Crear empresa'
                    )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmacionModal
        visible={mostrarConfirmacion}
        titulo={
          confirmacionEsDesactivacion
            ? 'Desactivar empresa'
            : 'Activar empresa'
        }
        mensaje={
          empresaConfirmacion
            ? `¿Deseas ${
                confirmacionEsDesactivacion
                  ? 'desactivar'
                  : 'activar'
              } la empresa ${
                empresaConfirmacion.nombre ||
                empresaConfirmacion.id
              }?`
            : ''
        }
        textoConfirmar={
          confirmacionEsDesactivacion
            ? 'Desactivar'
            : 'Activar'
        }
        variante={
          confirmacionEsDesactivacion
            ? 'peligro'
            : 'exito'
        }
        procesando={
          Boolean(
            empresaProcesando
          )
        }
        onConfirmar={
          confirmarCambioEstado
        }
        onCerrar={
          cerrarConfirmacionEstado
        }
      />
    </div>
  );
}

export default EmpresasPage;
