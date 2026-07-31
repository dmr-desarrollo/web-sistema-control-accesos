function ConfirmacionModal({
  visible,
  titulo,
  mensaje,
  textoConfirmar,
  variante = 'peligro',
  procesando,
  onConfirmar,
  onCerrar
}) {
  if (!visible) {
    return null;
  }

  const cerrarDesdeFondo = () => {
    if (procesando) {
      return;
    }

    onCerrar();
  };

  return (
    <div
      className="modal-fondo"
      role="presentation"
      onMouseDown={cerrarDesdeFondo}
    >
      <div
        className="modal-confirmacion"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-confirmacion"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-cabecera">
          <div>
            <h2 id="titulo-confirmacion">
              {titulo}
            </h2>

            <p>
              {mensaje}
            </p>
          </div>

          <button
            type="button"
            className="boton-cerrar-modal"
            onClick={onCerrar}
            disabled={procesando}
            aria-label="Cerrar confirmación"
          >
            ×
          </button>
        </div>

        <div className="modal-confirmacion-aviso">
          Esta acción actualizará el estado del usuario
          tanto en Firebase Authentication como en
          Firestore.
        </div>

        <div className="modal-acciones">
          <button
            type="button"
            className="boton-cancelar"
            onClick={onCerrar}
            disabled={procesando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={
              variante === 'exito'
                ? 'boton-confirmar-exito'
                : 'boton-confirmar-peligro'
            }
            onClick={onConfirmar}
            disabled={procesando}
          >
            {procesando
              ? 'Procesando...'
              : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmacionModal;
