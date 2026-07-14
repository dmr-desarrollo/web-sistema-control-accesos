import { useState } from 'react';

function FormularioVisitable({ visitable, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(visitable?.nombre || '');
  const [apellido, setApellido] = useState(visitable?.apellido || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar({ nombre, apellido });
  };

  return (
    <form onSubmit={handleSubmit} className="formulario-visitable">
      <h2>{visitable ? 'Editar Persona Visitable' : 'Crear Persona Visitable'}</h2>
      
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="apellido">Apellido</label>
        <input
          type="text"
          id="apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />
      </div>
      
      <div className="botones">
        <button type="submit">Guardar</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

export default FormularioVisitable;
