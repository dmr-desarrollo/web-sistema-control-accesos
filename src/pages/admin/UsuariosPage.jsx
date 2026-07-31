import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate,
  useSearchParams
} from 'react-router-dom';

import ConfirmacionModal from '../../components/usuarios/ConfirmacionModal';
import PasswordModal from '../../components/usuarios/PasswordModal';
import UsuarioModal from '../../components/usuarios/UsuarioModal';
import UsuarioTable from '../../components/usuarios/UsuarioTable';

import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  cambiarPasswordTemporal,
  crearUsuarioAdministrado,
  listarUsuarios,
  obtenerEmpresasActivas
} from '../../services/usuarios';

const FORMULARIO_INICIAL = {
  uid: '',
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  empresaId: '',
  rol: 'operador'
};

function UsuariosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const empresaSeleccionada =
    searchParams.get('empresa') || '';

  const [usuarios, setUsuarios] =
    useState([]);

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

  const [errorCarga, setErrorCarga] =
    useState('');

  const [errorFormulario, setErrorFormulario] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroEmpresa, setFiltroEmpresa] =
    useState('');

  const [filtroRol, setFiltroRol] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState('');

  const [usuarioProcesando, setUsuarioProcesando] =
    useState(null);

  const [
    usuarioConfirmacion,
    setUsuarioConfirmacion
  ] = useState(null);

  const [
    mostrarConfirmacion,
    setMostrarConfirmacion
  ] = useState(false);

  const [
    mostrarPasswordModal,
    setMostrarPasswordModal
  ] = useState(false);

  const [
    usuarioPassword,
    setUsuarioPassword
  ] = useState(null);

  const [
    errorPassword,
    setErrorPassword
  ] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const empresaActual = useMemo(() => {
    if (!empresaSeleccionada) {
      return null;
    }

    return (
      empresas.find(
        (empresa) =>
          empresa.id === empresaSeleccionada
      ) || null
    );
  }, [
    empresas,
    empresaSeleccionada
  ]);

  const usuariosFiltrados = useMemo(() => {
    const textoBusqueda =
      busqueda
        .trim()
        .toLowerCase();

    return usuarios.filter((usuario) => {
      const nombreCompleto = [
        usuario.nombre,
        usuario.apellido
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const email =
        String(usuario.email || '')
          .toLowerCase();

      const coincideBusqueda =
        !textoBusqueda ||
        nombreCompleto.includes(
          textoBusqueda
        ) ||
        email.includes(
          textoBusqueda
        );

      const empresaFiltroFinal =
        empresaSeleccionada ||
        filtroEmpresa;

      const coincideEmpresa =
        !empresaFiltroFinal ||
        usuario.empresaId ===
          empresaFiltroFinal;

      const coincideRol =
        !filtroRol ||
        usuario.rol === filtroRol;

      const coincideEstado =
        !filtroEstado ||
        usuario.estado === filtroEstado;

      return (
        coincideBusqueda &&
        coincideEmpresa &&
        coincideRol &&
        coincideEstado
      );
    });
  }, [
    usuarios,
    busqueda,
    empresaSeleccionada,
    filtroEmpresa,
    filtroRol,
    filtroEstado
  ]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setErrorCarga('');

      const [
        datosUsuarios,
        datosEmpresas
      ] = await Promise.all([
        listarUsuarios(),
        obtenerEmpresasActivas()
      ]);

      setUsuarios(datosUsuarios);
      setEmpresas(datosEmpresas);
    } catch (error) {
      console.error(
        'Error cargando el módulo de usuarios:',
        error
      );

      setErrorCarga(
        error.message ||
          'No fue posible cargar los usuarios.'
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

    setFormulario({
      ...FORMULARIO_INICIAL,
      empresaId: empresaSeleccionada
    });

    setErrorFormulario('');
    setErrorCarga('');
    setMensaje('');
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = (usuario) => {
    if (usuario.rol === 'superadmin') {
      setMensaje('');

      setErrorCarga(
        'El administrador global no puede editarse desde este módulo.'
      );

      return;
    }

    setModoFormulario('editar');

    setFormulario({
      uid: usuario.uid,
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      password: '',
      empresaId: usuario.empresaId || '',
      rol: usuario.rol || 'operador'
    });

    setErrorCarga('');
    setErrorFormulario('');
    setMensaje('');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setModoFormulario('crear');
    setFormulario(FORMULARIO_INICIAL);
    setErrorFormulario('');
  };

  const guardarUsuario = async (event) => {
    event.preventDefault();

    setErrorFormulario('');
    setMensaje('');

    const nombre =
      formulario.nombre.trim();

    const apellido =
      formulario.apellido.trim();

    const email =
      formulario.email
        .trim()
        .toLowerCase();

    if (!nombre) {
      setErrorFormulario(
        'Debes ingresar el nombre.'
      );

      return;
    }

    if (!email) {
      setErrorFormulario(
        'Debes ingresar el correo electrónico.'
      );

      return;
    }

    if (
      modoFormulario === 'crear' &&
      formulario.password.length < 6
    ) {
      setErrorFormulario(
        'La contraseña temporal debe tener al menos 6 caracteres.'
      );

      return;
    }

    if (!formulario.empresaId) {
      setErrorFormulario(
        'Debes seleccionar una empresa.'
      );

      return;
    }

    try {
      setGuardando(true);

      if (modoFormulario === 'editar') {
        await actualizarUsuario({
          uid: formulario.uid,
          nombre,
          apellido,
          email,
          empresaId: formulario.empresaId,
          rol: formulario.rol
        });
      } else {
        await crearUsuarioAdministrado({
          nombre,
          apellido,
          email,
          password: formulario.password,
          empresaId: formulario.empresaId,
          rol: formulario.rol
        });
      }

      const usuariosActualizados =
        await listarUsuarios();

      setUsuarios(
        usuariosActualizados
      );

      setMostrarFormulario(false);
      setModoFormulario('crear');
      setFormulario(
        FORMULARIO_INICIAL
      );

      setMensaje(
        modoFormulario === 'editar'
          ? 'El usuario fue actualizado correctamente.'
          : 'El usuario fue creado correctamente.'
      );
    } catch (error) {
      console.error(
        modoFormulario === 'editar'
          ? 'Error actualizando usuario:'
          : 'Error creando usuario:',
        error
      );

      setErrorFormulario(
        error.message ||
          (
            modoFormulario === 'editar'
              ? 'No fue posible actualizar el usuario.'
              : 'No fue posible crear el usuario.'
          )
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirConfirmacionEstado = (usuario) => {
    setUsuarioConfirmacion(usuario);
    setMensaje('');
    setErrorCarga('');
    setMostrarConfirmacion(true);
  };

  const cerrarConfirmacionEstado = () => {
    if (usuarioProcesando) {
      return;
    }

    setMostrarConfirmacion(false);
    setUsuarioConfirmacion(null);
  };

  const confirmarCambioEstado = async () => {
    if (!usuarioConfirmacion?.uid) {
      setMostrarConfirmacion(false);

      setErrorCarga(
        'No se pudo identificar al usuario seleccionado.'
      );

      return;
    }

    const estaActivo =
      usuarioConfirmacion.estado === 'activo';

    const nuevoEstado =
      estaActivo
        ? 'inactivo'
        : 'activo';

    try {
      setUsuarioProcesando(
        usuarioConfirmacion.uid
      );

      setErrorCarga('');
      setMensaje('');

      await cambiarEstadoUsuario({
        uid: usuarioConfirmacion.uid,
        estado: nuevoEstado
      });

      const usuariosActualizados =
        await listarUsuarios();

      setUsuarios(
        usuariosActualizados
      );

      setMostrarConfirmacion(false);
      setUsuarioConfirmacion(null);

      setMensaje(
        nuevoEstado === 'activo'
          ? 'El usuario fue activado correctamente.'
          : 'El usuario fue desactivado correctamente.'
      );
    } catch (error) {
      console.error(
        'Error cambiando estado del usuario:',
        error
      );

      setErrorCarga(
        error.message ||
          'No fue posible cambiar el estado del usuario.'
      );
    } finally {
      setUsuarioProcesando(null);
    }
  };

  const abrirPasswordModal = (usuario) => {
    setUsuarioPassword(usuario);
    setErrorPassword('');
    setMensaje('');
    setErrorCarga('');
    setMostrarPasswordModal(true);
  };

  const cerrarPasswordModal = () => {
    if (usuarioProcesando) {
      return;
    }

    setMostrarPasswordModal(false);
    setUsuarioPassword(null);
    setErrorPassword('');
  };

  const guardarPassword = async ({
    password,
    confirmacion
  }) => {
    setErrorPassword('');
    setMensaje('');

    if (!password) {
      setErrorPassword(
        'Debes ingresar una contraseña.'
      );

      return;
    }

    if (password.length < 6) {
      setErrorPassword(
        'La contraseña debe tener al menos 6 caracteres.'
      );

      return;
    }

    if (password !== confirmacion) {
      setErrorPassword(
        'Las contraseñas no coinciden.'
      );

      return;
    }

    if (!usuarioPassword?.uid) {
      setErrorPassword(
        'No se pudo identificar al usuario seleccionado.'
      );

      return;
    }

    try {
      setUsuarioProcesando(
        usuarioPassword.uid
      );

      await cambiarPasswordTemporal({
        uid: usuarioPassword.uid,
        password
      });

      setMostrarPasswordModal(false);
      setUsuarioPassword(null);

      setMensaje(
        'La contraseña fue actualizada correctamente.'
      );
    } catch (error) {
      console.error(
        'Error cambiando contraseña:',
        error
      );

      setErrorPassword(
        error.message ||
          'No fue posible cambiar la contraseña.'
      );
    } finally {
      setUsuarioProcesando(null);
    }
  };

  const volver = () => {
    if (empresaSeleccionada) {
      navigate(
        '/admin/empresas'
      );

      return;
    }

    navigate('/admin');
  };

  const nombreEmpresa =
    empresaActual?.nombre ||
    empresaSeleccionada;

  const nombreUsuarioConfirmacion = [
    usuarioConfirmacion?.nombre,
    usuarioConfirmacion?.apellido
  ]
    .filter(Boolean)
    .join(' ');

  const confirmacionEsDesactivacion =
    usuarioConfirmacion?.estado ===
    'activo';

  return (
    <div className="admin-page">
      <header className="admin-cabecera">
        <div>
          <button
            type="button"
            className="boton-volver"
            onClick={volver}
          >
            ← Volver
          </button>

          <h1>
            {empresaSeleccionada
              ? `Usuarios de ${nombreEmpresa}`
              : 'Usuarios'}
          </h1>

          <p>
            {empresaSeleccionada
              ? `Administrar los usuarios asociados a ${nombreEmpresa}.`
              : 'Crear y administrar los usuarios registrados en el sistema.'}
          </p>
        </div>

        <button
          type="button"
          className="boton-nueva-empresa"
          onClick={abrirFormularioCrear}
          disabled={cargando}
        >
          Nuevo usuario
        </button>
      </header>

      <section className="admin-filtros">
        <div className="campo-formulario">
          <label htmlFor="buscar-usuario">
            Buscar
          </label>

          <input
            id="buscar-usuario"
            type="search"
            placeholder="Nombre o correo"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value
              )
            }
          />
        </div>

        {!empresaSeleccionada && (
          <div className="campo-formulario">
            <label htmlFor="filtro-empresa">
              Empresa
            </label>

            <select
              id="filtro-empresa"
              value={filtroEmpresa}
              onChange={(event) =>
                setFiltroEmpresa(
                  event.target.value
                )
              }
            >
              <option value="">
                Todas
              </option>

              {empresas.map((empresa) => (
                <option
                  key={empresa.id}
                  value={empresa.id}
                >
                  {empresa.nombre ||
                    empresa.id}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="campo-formulario">
          <label htmlFor="filtro-rol">
            Rol
          </label>

          <select
            id="filtro-rol"
            value={filtroRol}
            onChange={(event) =>
              setFiltroRol(
                event.target.value
              )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="superadmin">
              Administrador global
            </option>

            <option value="admin_empresa">
              Administrador de empresa
            </option>

            <option value="operador">
              Operador
            </option>
          </select>
        </div>

        <div className="campo-formulario">
          <label htmlFor="filtro-estado">
            Estado
          </label>

          <select
            id="filtro-estado"
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
              Activo
            </option>

            <option value="inactivo">
              Inactivo
            </option>
          </select>
        </div>

        <div className="admin-contador">
          <strong>
            {usuariosFiltrados.length}
          </strong>

          {' '}

          {usuariosFiltrados.length === 1
            ? 'usuario'
            : 'usuarios'}
        </div>
      </section>

      {mensaje && (
        <div className="mensaje-exito">
          {mensaje}
        </div>
      )}

      {errorCarga && (
        <div className="error admin-mensaje">
          {errorCarga}
        </div>
      )}

      {cargando ? (
        <div className="dashboard-estado">
          Cargando usuarios...
        </div>
      ) : (
        <UsuarioTable
          usuarios={usuariosFiltrados}
          empresas={empresas}
          onEditar={
            abrirFormularioEditar
          }
          onCambiarEstado={
            abrirConfirmacionEstado
          }
          onCambiarPassword={
            abrirPasswordModal
          }
          usuarioProcesando={
            usuarioProcesando
          }
        />
      )}

      <UsuarioModal
        visible={mostrarFormulario}
        modo={modoFormulario}
        formulario={formulario}
        empresas={empresas}
        guardando={guardando}
        empresaBloqueada={
          Boolean(
            empresaSeleccionada
          )
        }
        error={errorFormulario}
        onChange={actualizarCampo}
        onSubmit={guardarUsuario}
        onCerrar={cerrarFormulario}
      />

      <PasswordModal
        visible={mostrarPasswordModal}
        usuario={usuarioPassword}
        guardando={
          Boolean(
            usuarioProcesando
          )
        }
        error={errorPassword}
        onSubmit={guardarPassword}
        onCerrar={cerrarPasswordModal}
      />

      <ConfirmacionModal
        visible={mostrarConfirmacion}
        titulo={
          confirmacionEsDesactivacion
            ? 'Desactivar usuario'
            : 'Activar usuario'
        }
        mensaje={
          usuarioConfirmacion
            ? `¿Deseas ${
                confirmacionEsDesactivacion
                  ? 'desactivar'
                  : 'activar'
              } a ${
                nombreUsuarioConfirmacion ||
                usuarioConfirmacion.email
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
            usuarioProcesando
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

export default UsuariosPage;
