import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate,
  useSearchParams
} from 'react-router-dom';

import UsuarioModal from '../../components/usuarios/UsuarioModal';
import UsuarioTable from '../../components/usuarios/UsuarioTable';

import {
  crearUsuarioAdministrado,
  actualizarUsuario,
  cambiarEstadoUsuario,
  cambiarPasswordTemporal,
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

  const [usuarioProcesando, setUsuarioProcesando] =
    useState(null);

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
    if (!empresaSeleccionada) {
      return usuarios;
    }

    return usuarios.filter(
      (usuario) =>
        usuario.empresaId ===
        empresaSeleccionada
    );
  }, [
    usuarios,
    empresaSeleccionada
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
    const { name, value } = event.target;

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

      setUsuarios(usuariosActualizados);

      setMostrarFormulario(false);
      setModoFormulario('crear');
      setFormulario(FORMULARIO_INICIAL);

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


 const cambiarEstado = async (usuario) => {
    const estaActivo =
      usuario.estado === 'activo';

    const nuevoEstado =
      estaActivo
        ? 'inactivo'
        : 'activo';

    const accion =
      estaActivo
        ? 'desactivar'
        : 'activar';

    const nombreCompleto = [
      usuario.nombre,
      usuario.apellido
    ]
      .filter(Boolean)
      .join(' ');

    const confirmado = window.confirm(
      `¿Deseas ${accion} al usuario ` +
      `${nombreCompleto || usuario.email}?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setUsuarioProcesando(usuario.uid);
      setErrorCarga('');
      setMensaje('');

      await cambiarEstadoUsuario({
        uid: usuario.uid,
        estado: nuevoEstado
      });

      const usuariosActualizados =
        await listarUsuarios();

      setUsuarios(usuariosActualizados);

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


const cambiarPassword = async (usuario) => {
  const nuevaPassword = window.prompt(
    `Nueva contraseña temporal para ${usuario.nombre} ${usuario.apellido}:`
  );

  if (!nuevaPassword) {
    return;
  }

  if (nuevaPassword.length < 6) {
    setErrorCarga(
      'La contraseña debe tener al menos 6 caracteres.'
    );
    return;
  }

  try {
    setUsuarioProcesando(usuario.uid);
    setErrorCarga('');
    setMensaje('');

    await cambiarPasswordTemporal({
      uid: usuario.uid,
      password: nuevaPassword
    });

    setMensaje(
      'La contraseña fue actualizada correctamente.'
    );
  } catch (error) {
    console.error(
      'Error cambiando contraseña:',
      error
    );

    setErrorCarga(
      error.message ||
      'No fue posible cambiar la contraseña.'
    );
  } finally {
    setUsuarioProcesando(null);
  }
};


  const volver = () => {
    if (empresaSeleccionada) {
      navigate('/admin/empresas');
      return;
    }

    navigate('/admin');
  };

  const nombreEmpresa =
    empresaActual?.nombre ||
    empresaSeleccionada;

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
          onEditar={abrirFormularioEditar}
          onCambiarEstado={cambiarEstado}
          onCambiarPassword={cambiarPassword}
          usuarioProcesando={usuarioProcesando}
        />
      )}

      <UsuarioModal
        visible={mostrarFormulario}
        modo={modoFormulario}
        formulario={formulario}
        empresas={empresas}
        guardando={guardando}
        empresaBloqueada={
          Boolean(empresaSeleccionada)
        }
        error={errorFormulario}
        onChange={actualizarCampo}
        onSubmit={guardarUsuario}
        onCerrar={cerrarFormulario}
      />
    </div>
  );
}

export default UsuariosPage;
