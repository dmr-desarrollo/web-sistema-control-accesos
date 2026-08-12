import {
  useEffect,
  useState
} from 'react';

function FormularioVisitable({
  visitable,
  guardando,
  error,
  onGuardar,
  onCancelar
}) {
  const [nombre, setNombre] =
    useState('');

  const [apellido, setApellido] =
    useState('');

  useEffect(() => {
    setNombre(
      visitable?.nombre || ''
    );

    setApellido(
      visitable?.apellido || ''
    );
  }, [visitable]);

  const enviarFormulario = (event) => {
    event.preventDefault();

    onGuardar({
      nombre,
      apellido
    });
  };

  return (
    <form
      className="formulario-empresa"
      onSubmit={enviarFormulario}
    >
      {error && (
        <div className="error campo-completo">
          {error}
        </div>
      )}

      <div className="campo-formulario">
        <label htmlFor="nombre-visitable">
          Nombre
        </label>

        <input
          id="nombre-visitable"
          type="text"
          value={nombre}
          onChange={(event) =>
            setNombre(event.target.value)
          }
          maxLength={80}
          autoComplete="given-name"
          disabled={guardando}
          autoFocus
          required
        />
      </div>

      <div className="campo-formulario">
        <label htmlFor="apellido-visitable">
          Apellido
        </label>

        <input
          id="apellido-visitable"
          type="text"
          value={apellido}
          onChange={(event) =>
            setApellido(event.target.value)
          }
          maxLength={80}
          autoComplete="family-name"
          disabled={guardando}
          required
        />
      </div>

      <div className="modal-acciones campo-completo">
        <button
          type="button"
          className="boton-cancelar"
          onClick={onCancelar}
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
            : visitable
              ? 'Guardar cambios'
              : 'Crear persona'}
        </button>
      </div>
    </form>
  );
}

export default FormularioVisitable;
