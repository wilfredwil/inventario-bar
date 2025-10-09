// src/components/ToastNotification.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

// Contexto para manejar las notificaciones globalmente
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};

// Provider que envuelve la aplicación
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remover después de la duración especificada
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Funciones de conveniencia
  const success = (message, duration) => addToast(message, 'success', duration);
  const error = (message, duration) => addToast(message, 'danger', duration);
  const warning = (message, duration) => addToast(message, 'warning', duration);
  const info = (message, duration) => addToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
      {children}
      <ToastContainer 
        position="top-end" 
        className="p-3" 
        style={{ zIndex: 9999, position: 'fixed', top: '70px', right: '20px' }}
      >
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

// Componente individual de notificación
function ToastNotification({ message, type, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setShow(true), 10);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // Esperar a que termine la animación
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="me-2" />;
      case 'danger':
        return <FaTimesCircle className="me-2" />;
      case 'warning':
        return <FaExclamationTriangle className="me-2" />;
      case 'info':
      default:
        return <FaInfoCircle className="me-2" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Éxito';
      case 'danger':
        return 'Error';
      case 'warning':
        return 'Advertencia';
      case 'info':
      default:
        return 'Información';
    }
  };

  return (
    <Toast
      show={show}
      onClose={handleClose}
      bg={type}
      className="toast-notification"
      style={{
        minWidth: '300px',
        marginBottom: '10px',
        animation: show ? 'slideInRight 0.3s ease' : 'slideOutRight 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px'
      }}
    >
      <Toast.Header closeButton>
        <strong className="me-auto d-flex align-items-center">
          {getIcon()}
          {getTitle()}
        </strong>
      </Toast.Header>
      <Toast.Body className={type === 'danger' || type === 'dark' ? 'text-white' : ''}>
        {message}
      </Toast.Body>
    </Toast>
  );
}

// CSS adicional para las animaciones (agregar al App.css)
const toastStyles = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast-notification {
  backdrop-filter: blur(10px);
}

body.dark-mode .toast-header {
  background-color: rgba(30, 41, 59, 0.95);
  color: #f1f5f9;
  border-bottom: 1px solid #475569;
}

body.dark-mode .toast-body {
  background-color: rgba(30, 41, 59, 0.95);
}

body.dark-mode .btn-close {
  filter: invert(1);
}
`;

export default ToastNotification;