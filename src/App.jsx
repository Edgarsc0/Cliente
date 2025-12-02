import { useState, useEffect } from 'react';

const App = () => {
  // Inicializamos los estados en `null` para saber que aún no hemos recibido datos.
  const [humedad, setHumedad] = useState(null);
  const [voltajeSensor, setVoltajeSensor] = useState(null);
  // "CAS" probablemente se refiere al Conversor Analógico-Digital (ADC).
  // Almacenaremos el valor crudo que envía el Arduino (0-1023).
  const [valorCAS, setValorCAS] = useState(null);

  useEffect(() => {
    // 1. Creamos una nueva instancia del cliente WebSocket.
    // Se conectará al servidor que ya tienes en `ws://localhost:8080`.
    const ws = new WebSocket('wss://servidor-1hnh.onrender.com');

    // 2. Evento que se dispara cuando la conexión se establece con éxito.
    ws.onopen = () => {
      console.log('Conectado al servidor WebSocket');
    };

    // 3. Evento principal: se dispara cuando se recibe un mensaje del servidor.
    ws.onmessage = (event) => {
      const data = event.data;

      try {
        const partes = data.split('|'); // Ej: ["Valor: 252 ", " Volts: 4.94"]
        if (partes.length < 2) return; // Ignorar mensajes malformados        
        const volts = parseFloat(partes[1].split(':')[1].trim());

        const humedadRelativa = 20 * volts;
        const voltajeSensor = (3.3 / 100) * humedadRelativa;

        // Actualizamos todos los estados con los nuevos valores
        setValorCAS(volts);
        setVoltajeSensor(voltajeSensor);
        setHumedad(humedadRelativa);
      } catch (error) {
        console.error("Error al procesar el mensaje del WebSocket:", error);
      }
    };

    // 4. Función de limpieza: se ejecuta cuando el componente se "desmonta".
    // Esto es crucial para cerrar la conexión y evitar fugas de memoria.
    return () => {
      ws.close();
    };
  }, []);

  return (
    <main className="bg-slate-100 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
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
              <p className="text-3xl font-bold text-orange-600">{valorCAS !== null ? valorCAS : '----'}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
export default App;