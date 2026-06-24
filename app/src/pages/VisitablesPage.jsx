import { useState } from 'react';
import ListaVisitables from '../components/visitables/ListaVisitables';
import FormularioVisitable from '../components/visitables/FormularioVisitable';
import { crearPersonaVisitable, actualizarPersonaVisitable } from '../services/visitables';

function VisitablesPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [visitableSeleccionado, setVisitableSeleccionado] = useState(null);
  const [recargar, setRecargar] = useState(false);

  const handleGuardar = async (datos) => {
    try {
      if (visitableSeleccionado) {
        await actualizarPersonaVisitable(visitableSeleccionado.id, datos);
      } else {
        await crearPersonaVisitable(datos);
      }
      setMostrarFormulario(false);
      setVisitableSeleccionado(null);
      setRecargar(!recargar);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const handleEditar = (visitable) => {
    setVisitableSeleccionado(visitable);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setVisitableSeleccionado(null);
  };

  return (
    <div className="visitables-page">
      <h1>Gestión de Personas Visitables</h1>
      
      {!mostrarFormulario && (
        <button onClick={() => setMostrarFormulario(true)}>
          Nueva Persona Visitable
        </button>
      )}
      
      {mostrarFormulario ? (
        <FormularioVisitable
          visitable={visitableSeleccionado}
          onGuardar={handleGuardar}
          onCancelar={handleCancelar}
        />
      ) : (
        <ListaVisitables
          onEditar={handleEditar}
          onRecargar={() => setRecargar(!recargar)}
        />
      )}
    </div>
  );
}

export default VisitablesPage;
