import UsuarioForm from './UsuarioForm';

function UsuarioModal({
  visible,
  modo,
  formulario,
  empresas,
  guardando,
  empresaBloqueada,
  esAdminEmpresa,
  error,
  onChange,
  onSubmit,
  onCerrar
}) {
  if (!visible) {
    return null;
  }

  const esEdicion =
    modo === 'editar';

  const cerrarDesdeFondo = () => {
    if (guardando) {
      return;
    }

    onCerrar();
  };

  return (
    <div
      className="modal-fondo"
      role="presentation"
      onMouseDown={
        cerrarDesdeFondo
      }
    >
      <div
        className="modal-empresa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-usuario"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-cabecera">
          <div>
            <h2 id="titulo-usuario">
              {esEdicion
                ? 'Editar usuario'
                : 'Nuevo usuario'}
            </h2>

            <p>
              {esEdicion
                ? 'Modifica los datos de la cuenta seleccionada.'
                : esAdminEmpresa
                  ? 'Crea un operador para tu empresa.'
                  : 'Completa los datos de la nueva cuenta.'}
            </p>
          </div>

          <button
            type="button"
            className="boton-cerrar-modal"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </div>

        <UsuarioForm
          modo={modo}
          formulario={
            formulario
          }
          empresas={
            empresas
          }
          guardando={
            guardando
          }
          empresaBloqueada={
            empresaBloqueada
          }
          esAdminEmpresa={
            esAdminEmpresa
          }
          error={error}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancelar={
            onCerrar
          }
        />
      </div>
    </div>
  );
}

export default UsuarioModal;
