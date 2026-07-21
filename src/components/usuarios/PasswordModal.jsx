import {
  useEffect,
  useState
} from 'react';

function PasswordModal({
  visible,
  usuario,
  guardando,
  error,
  onSubmit,
  onCerrar
}) {
  const [password, setPassword] =
    useState('');

  const [confirmacion, setConfirmacion] =
    useState('');

  useEffect(() => {
    if (visible) {
      setPassword('');
      setConfirmacion('');
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const nombreCompleto = [
    usuario?.nombre,
    usuario?.apellido
  ]
    .filter(Boolean)
    .join(' ');

  const cerrarDesdeFondo = () => {
    if (guardando) {
      return;
    }

    onCerrar();
  };

  const enviarFormulario = (event) => {
    event.preventDefault();

    onSubmit({
      password,
      confirmacion
    });
  };

  return (
    <div
      className="modal-fondo"
      role="presentation"
      onMouseDown={cerrarDesdeFondo}
    >
      <div
        className="modal-empresa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-password"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-cabecera">
          <div>
            <h2 id="titulo-password">
              Cambiar contraseña
            </h2>

            <p>
              Establece una nueva contraseña
              para la cuenta seleccionada.
            </p>
          </div>

          <button
            type="button"
            className="boton-cerrar-modal"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={enviarFormulario}>
          <div className="campo-formulario">
            <label htmlFor="usuario-password">
              Usuario
            </label>

            <input
              id="usuario-password"
              type="text"
              value={
                nombreCompleto ||
                usuario?.email ||
                ''
              }
              disabled
            />
          </div>

          <div className="campo-formulario">
            <label htmlFor="nueva-password">
              Nueva contraseña
            </label>

            <input
              id="nueva-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              disabled={guardando}
              autoFocus
            />
          </div>

          <div className="campo-formulario">
            <label htmlFor="confirmar-password">
              Confirmar contraseña
            </label>

            <input
              id="confirmar-password"
              type="password"
              value={confirmacion}
              onChange={(event) =>
                setConfirmacion(
                  event.target.value
                )
              }
              autoComplete="new-password"
              disabled={guardando}
            />
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <div className="modal-acciones">
            <button
              type="button"
              className="boton-cancelar"
              onClick={onCerrar}
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
                ? 'Guardando...'
                : 'Guardar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PasswordModal;
