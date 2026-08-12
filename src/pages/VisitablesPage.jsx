import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import ConfirmacionModal from '../components/usuarios/ConfirmacionModal';
import FormularioVisitable from '../components/visitables/FormularioVisitable';
import ListaVisitables from '../components/visitables/ListaVisitables';

import { useAuth } from '../hooks/useAuth';

import {
  actualizarPersonaVisitable,
  cambiarEstadoPersonaVisitable,
  crearPersonaVisitable,
  obtenerPersonasVisitables
} from '../services/visitables';

function VisitablesPage() {
  const { perfil } = useAuth();

  const [visitables, setVisitables] =
    useState([]);

  const [
    visitableSeleccionado,
    setVisitableSeleccionado
  ] = useState(null);

  const [
    visitableConfirmacion,
    setVisitableConfirmacion
  ] = useState(null);

  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false);

  const [
    mostrarConfirmacion,
    setMostrarConfirmacion
  ] = useState(false);

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState('');

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [
    visitableProcesando,
    setVisitableProcesando
  ] = useState(null);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const empresaId =
    String(
      perfil?.empresaId || ''
    ).trim();

  const cargarVisitables =
    useCallback(async () => {
      if (!empresaId) {
        setVisitables([]);

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
          await obtenerPersonasVisitables({
            empresaId,
            incluirInactivos: true
          });

        setVisitables(datos);
      } catch (err) {
        console.error(
          'Error cargando personas visitables:',
          err
        );

        setError(
          err.message ||
            'No fue posible cargar las personas visitables.'
        );
      } finally {
        setCargando(false);
      }
    }, [
      empresaId
    ]);

  useEffect(() => {
    cargarVisitables();
  }, [
    cargarVisitables
  ]);

  const visitablesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return visitables.filter(
        (visitable) => {
          const nombreCompleto = [
            visitable.nombre,
            visitable.apellido
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          const coincideBusqueda =
            !texto ||
            nombreCompleto.includes(
              texto
            );

          const estado =
            visitable.estado ||
            'activo';

          const coincideEstado =
            !filtroEstado ||
            estado === filtroEstado;

          return (
            coincideBusqueda &&
            coincideEstado
          );
        }
      );
    }, [
      visitables,
      busqueda,
      filtroEstado
    ]);

  const abrirFormularioCrear = () => {
    setVisitableSeleccionado(null);
    setError('');
    setMensaje('');
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = (
    visitable
  ) => {
    setVisitableSeleccionado(
      visitable
    );

    setError('');
    setMensaje('');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setVisitableSeleccionado(null);
    setError('');
  };

  const guardarVisitable = async (
    datos
  ) => {
    if (!empresaId) {
      setError(
        'El usuario no tiene una empresa asignada.'
      );

      return;
    }

    const nombre =
      String(
        datos.nombre || ''
      ).trim();

    const apellido =
      String(
        datos.apellido || ''
      ).trim();

    if (!nombre) {
      setError(
        'Debes ingresar el nombre.'
      );

      return;
    }

    if (!apellido) {
      setError(
        'Debes ingresar el apellido.'
      );

      return;
    }

    try {
      setGuardando(true);
      setError('');
      setMensaje('');

      if (visitableSeleccionado) {
        await actualizarPersonaVisitable({
          id:
            visitableSeleccionado.id,
          empresaId,
          nombre,
          apellido,
          actualizadoPorUid:
            perfil?.uid || ''
        });
      } else {
        await crearPersonaVisitable({
          empresaId,
          nombre,
          apellido,
          creadoPorUid:
            perfil?.uid || ''
        });
      }

      setMostrarFormulario(false);
      setVisitableSeleccionado(null);

      await cargarVisitables();

      setMensaje(
        visitableSeleccionado
          ? 'La persona visitable fue actualizada correctamente.'
          : 'La persona visitable fue creada correctamente.'
      );
    } catch (err) {
      console.error(
        visitableSeleccionado
          ? 'Error actualizando persona visitable:'
          : 'Error creando persona visitable:',
        err
      );

      setError(
        err.message ||
          (
            visitableSeleccionado
              ? 'No fue posible actualizar la persona visitable.'
              : 'No fue posible crear la persona visitable.'
          )
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirConfirmacionEstado = (
    visitable
  ) => {
    setVisitableConfirmacion(
      visitable
    );

    setError('');
    setMensaje('');
    setMostrarConfirmacion(true);
  };

  const cerrarConfirmacionEstado = () => {
    if (visitableProcesando) {
      return;
    }

    setMostrarConfirmacion(false);
    setVisitableConfirmacion(null);
  };

  const confirmarCambioEstado =
    async () => {
      if (
        !empresaId ||
        !visitableConfirmacion?.id
      ) {
        setMostrarConfirmacion(false);

        setError(
          'No fue posible identificar la persona visitable.'
        );

        return;
      }

      const estadoActual =
        visitableConfirmacion.estado ||
        'activo';

      const nuevoEstado =
        estadoActual === 'activo'
          ? 'inactivo'
          : 'activo';

      try {
        setVisitableProcesando(
          visitableConfirmacion.id
        );

        setError('');
        setMensaje('');

        await cambiarEstadoPersonaVisitable({
          id:
            visitableConfirmacion.id,
          empresaId,
          estado:
            nuevoEstado,
          actualizadoPorUid:
            perfil?.uid || ''
        });

        await cargarVisitables();

        setMostrarConfirmacion(false);
        setVisitableConfirmacion(null);

        setMensaje(
          nuevoEstado === 'activo'
            ? 'La persona visitable fue activada correctamente.'
            : 'La persona visitable fue desactivada correctamente.'
        );
      } catch (err) {
        console.error(
          'Error cambiando estado:',
          err
        );

        setError(
          err.message ||
            'No fue posible cambiar el estado.'
        );
      } finally {
        setVisitableProcesando(null);
      }
    };

  const estadoConfirmacion =
    visitableConfirmacion?.estado ||
    'activo';

  const confirmacionEsDesactivacion =
    estadoConfirmacion === 'activo';

  const nombreConfirmacion = [
    visitableConfirmacion?.nombre,
    visitableConfirmacion?.apellido
  ]
    .filter(Boolean)
    .join(' ');

  const nombreEmpresa =
    perfil?.empresaNombre ||
    perfil?.empresaId ||
    'Sin empresa asignada';

  return (
    <div className="admin-page">
      <header className="admin-cabecera">
        <div>
          <h1>
            Personas visitables
          </h1>

          <p>
            Empresa:{' '}
            <strong>
              {nombreEmpresa}
            </strong>
          </p>
        </div>

        <button
          type="button"
          className="boton-nueva-empresa"
          onClick={
            abrirFormularioCrear
          }
          disabled={
            cargando ||
            !empresaId
          }
        >
          Nueva persona
        </button>
      </header>

      <section className="admin-filtros">
        <div className="campo-formulario">
          <label htmlFor="buscar-visitable">
            Buscar
          </label>

          <input
            id="buscar-visitable"
            type="search"
            placeholder="Nombre o apellido"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value
              )
            }
          />
        </div>

        <div className="campo-formulario">
          <label htmlFor="estado-visitable">
            Estado
          </label>

          <select
            id="estado-visitable"
            value={filtroEstado}
            onChange={(event) =>
              setFiltroEstado(
                event.target.value
              )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="activo">
              Activos
            </option>

            <option value="inactivo">
              Inactivos
            </option>
          </select>
        </div>

        <div className="admin-contador">
          <strong>
            {visitablesFiltrados.length}
          </strong>

          {' '}

          {visitablesFiltrados.length === 1
            ? 'persona'
            : 'personas'}
        </div>
      </section>

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
          Cargando personas visitables...
        </div>
      ) : (
        <ListaVisitables
          visitables={
            visitablesFiltrados
          }
          onEditar={
            abrirFormularioEditar
          }
          onCambiarEstado={
            abrirConfirmacionEstado
          }
          visitableProcesando={
            visitableProcesando
          }
        />
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
            aria-labelledby="titulo-visitable"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-cabecera">
              <div>
                <h2 id="titulo-visitable">
                  {visitableSeleccionado
                    ? 'Editar persona visitable'
                    : 'Nueva persona visitable'}
                </h2>

                <p>
                  {visitableSeleccionado
                    ? 'Modifica los datos de la persona seleccionada.'
                    : 'Registra una persona que puede recibir visitas.'}
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

            <FormularioVisitable
              visitable={
                visitableSeleccionado
              }
              guardando={guardando}
              error={error}
              onGuardar={
                guardarVisitable
              }
              onCancelar={
                cerrarFormulario
              }
            />
          </div>
        </div>
      )}

      <ConfirmacionModal
        visible={mostrarConfirmacion}
        titulo={
          confirmacionEsDesactivacion
            ? 'Desactivar persona'
            : 'Activar persona'
        }
        mensaje={
          visitableConfirmacion
            ? `¿Deseas ${
                confirmacionEsDesactivacion
                  ? 'desactivar'
                  : 'activar'
              } a ${
                nombreConfirmacion ||
                'la persona seleccionada'
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
            visitableProcesando
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

export default VisitablesPage;
