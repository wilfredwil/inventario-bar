import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import App from './App';

// Suprimir errores conocidos e inofensivos del escáner de códigos
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorString = args.join(' ');
  
  // Lista de errores a ignorar (son internos de html5-qrcode y no afectan funcionalidad)
  const errorsToSuppress = [
    'AbortError: The play() request was interrupted',
    'video surface onabort() called',
    'Cannot set properties of null',
    'Failed to execute \'removeChild\'',
    'parameter 1 is not of type \'Node\''
  ];
  
  // Si el error contiene alguno de estos textos, no mostrarlo
  if (errorsToSuppress.some(suppressed => errorString.includes(suppressed))) {
    return; // Ignorar silenciosamente
  }
  
  // Mostrar todos los demás errores normalmente
  originalConsoleError.apply(console, args);
};

// Interceptar promesas rechazadas no manejadas (unhandled promise rejections)
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || '';
  
  // Lista de errores de promesas a ignorar
  const errorsToSuppress = [
    'AbortError',
    'The play() request was interrupted',
    'interrupted because the media was removed'
  ];
  
  // Si el error contiene alguno de estos textos, prevenirlo
  if (errorsToSuppress.some(suppressed => errorMessage.includes(suppressed))) {
    event.preventDefault(); // Evitar que se muestre en consola
    return;
  }
  
  // Dejar que otros errores se muestren normalmente
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);