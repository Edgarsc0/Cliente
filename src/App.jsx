import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';


const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  // Inicializamos los estados en `null` para saber que aún no hemos recibido datos.
  const [humedad, setHumedad] = useState(null);
  const [voltajeSensor, setVoltajeSensor] = useState(null);
  // "CAS" probablemente se refiere al Conversor Analógico-Digital (ADC).
  // Almacenaremos el valor crudo que envía el Arduino (0-1023).
  const [valorADC, setValorADC] = useState(null);
  const [showDisconnectionModal, setShowDisconnectionModal] = useState(false);
  const dataTimeoutRef = useRef(null);

  // Función para manejar la interrupción de datos y reiniciar el temporizador.
  const handleDataTimeout = () => {
    toast.error('Se ha interrumpido la recepción de datos.');
    setIsConnected(false);
    setShowDisconnectionModal(true);
  };

  useEffect(() => {
    // 1. Creamos una nueva instancia del cliente WebSocket.
    // Se conectará al servidor que ya tienes en `ws://localhost:8080`.
    const ws = new WebSocket('wss://servidor-1hnh.onrender.com');

    // 2. Evento que se dispara cuando la conexión se establece con éxito.
    ws.onopen = () => {
      console.log('Conectado al servidor WebSocket');
      setIsConnected(true);
      toast.success('Conectado al servidor correctamente.');

      // Inicia un temporizador. Si no se reciben datos en 10s, muestra una advertencia.
      dataTimeoutRef.current = setTimeout(handleDataTimeout, 10000); // 10 segundos de espera
    };

    // 3. Evento principal: se dispara cuando se recibe un mensaje del servidor.
    ws.onmessage = (event) => {
      const data = event.data;

      // Si había un timeout, lo limpiamos porque ya recibimos datos.
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }

      try {
        const partes = data.split('|'); // Ej: ["Valor: 252 ", " Volts: 4.94"]
        if (partes.length < 2) return; // Ignorar mensajes malformados        
        const adcValue = parseInt(partes[0].split(':')[1].trim(), 10);
        const volts = parseFloat(partes[1].split(':')[1].trim());

        const humedadRelativa = 20 * volts;
        const voltajeSensor = (3.3 / 100) * humedadRelativa;

        // Actualizamos todos los estados con los nuevos valores
        setValorADC(adcValue);
        setVoltajeSensor(voltajeSensor);
        setHumedad(humedadRelativa);

        // Reinicia el temporizador para la próxima advertencia.
        dataTimeoutRef.current = setTimeout(handleDataTimeout, 10000);
      } catch (error) {
        console.error("Error al procesar el mensaje del WebSocket:", error);
      }
    };

    // 4. Evento que se dispara cuando hay un error en la conexión.
    ws.onerror = (error) => {
      console.error('Error en WebSocket:', error);
      setIsConnected(false);
    };

    // 5. Evento que se dispara cuando la conexión se cierra.
    ws.onclose = () => {
      console.log('Desconectado del servidor WebSocket');
      setIsConnected(false);
      // Limpiamos cualquier temporizador pendiente.
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
      // Mostramos el modal de desconexión.
      setShowDisconnectionModal(true);
    };

    // 6. Función de limpieza: se ejecuta cuando el componente se "desmonta".
    // Esto es crucial para cerrar la conexión y evitar fugas de memoria.
    return () => {
      // Limpiamos el temporizador al desmontar.
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
      // Evitamos que el `onclose` se dispare al cerrar la pestaña intencionadamente.
      ws.onclose = null;
      ws.close();
    };
  }, []);

  const getStatusText = () => {
    if (!isConnected && !showDisconnectionModal) {
      return 'Conectando...';
    }
    return isConnected ? 'Conectado' : 'Desconectado';
  };

  return (
    <main className="bg-slate-100 min-h-screen flex items-center justify-center p-4">
      {/* Contenedor para las notificaciones toast */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Modal de Desconexión */}
      {showDisconnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Conexión Perdida</h2>
            <p className="text-slate-600 mb-6">Se ha perdido la conexión con el servidor. La página se recargará para intentar reconectar.</p>
            <button onClick={() => window.location.reload()} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">Reconectar</button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 relative">
        {/* Indicador de Conexión */}
        <div className={`my-2 flex items-center justify-center gap-2 text-xs font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-3 h-3 text-center rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          Conexion al servidor: {getStatusText()}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Monitor de Humedad</h1>        
        <p className="text-sm text-slate-500 text-center mb-6">Sensor: HMZ-433a1</p>

        <div className="grid grid-cols-2 gap-6 items-center">
          {/* Sección de la imagen del sensor */}
          <div className="flex justify-center items-center">
            <img src="https://www.ghitron.com/product/small/_imagecache/HMZ-433A1.png" alt="Sensor de Humedad HMZ-433a1" className="h-full w-full object-contain" />
          </div>

          {/* Sección de las lecturas */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-sm text-slate-600 font-medium">Humedad Relativa</span>
              <p className="text-3xl font-bold text-sky-600">{humedad !== null ? humedad.toFixed(1) : '--.-'}<span className="text-xl font-medium text-slate-500">%</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-sm text-slate-600 font-medium">Voltaje del sensor</span>
              <p className="text-3xl font-bold text-emerald-600">{voltajeSensor !== null ? voltajeSensor.toFixed(2) : '-.--'}<span className="text-xl font-medium text-slate-500"> V</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-sm text-slate-600 font-medium">Valor CAS (ADC)</span>
              <p className="text-3xl font-bold text-orange-600">{valorADC !== null ? valorADC : '----'}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
export default App;