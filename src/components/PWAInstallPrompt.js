// src/components/PWAInstallPrompt.js
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaDownload, FaApple, FaAndroid, FaShareSquare, FaPlus } from 'react-icons/fa';

function PWAInstallPrompt({ darkMode }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar iOS de manera más robusta
    const iOS = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    
    console.log('📱 Dispositivo detectado - iOS:', iOS);
    
    // Detectar Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);
    
    console.log('📱 Dispositivo detectado - Android:', android);

    // Verificar si ya está instalada
    const installed = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
    setIsInstalled(installed);

    // Evento beforeinstallprompt (solo funciona en Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (isInstalled) {
      alert('✅ La aplicación ya está instalada en tu dispositivo');
      return;
    }
    setShowModal(true);
  };

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Usuario instaló la PWA');
      }
      
      setDeferredPrompt(null);
      setShowModal(false);
    }
  };

  // No mostrar el botón si ya está instalada
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Botón de instalación */}
      <Button 
        variant={darkMode ? "outline-success" : "success"}
        size="sm" 
        onClick={handleInstallClick}
        className="d-lg-none me-2"
        title="Instalar aplicación"
      >
        <FaDownload />
      </Button>

      {/* Botón para desktop */}
      {deferredPrompt && (
        <Button 
          variant={darkMode ? "outline-success" : "success"}
          size="sm" 
          onClick={handleInstallClick}
          className="me-2 d-none d-lg-inline-block"
          title="Instalar aplicación"
        >
          <FaDownload className="me-1" />
          <span>Instalar App</span>
        </Button>
      )}

      {/* Modal de instrucciones */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Header 
          closeButton 
          style={{ 
            background: darkMode ? '#1e293b' : '#f8fafc',
            borderBottom: `2px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}
        >
          <Modal.Title style={{ 
            fontWeight: 700,
            color: darkMode ? '#f1f5f9' : '#0f172a'
          }}>
            📱 Instalar Aplicación
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ 
          padding: '2rem',
          background: darkMode ? '#1e293b' : '#ffffff',
          color: darkMode ? '#f1f5f9' : '#0f172a'
        }}>
          {isIOS ? (
            // Instrucciones para iOS
            <div>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '1.5rem',
                fontSize: '3rem'
              }}>
                <FaApple style={{ color: darkMode ? '#60a5fa' : '#3b82f6' }} />
              </div>
              
              <h5 style={{ 
                fontWeight: 600, 
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Instalación en iOS (iPhone/iPad)
              </h5>
              
              <div style={{ 
                background: darkMode ? '#334155' : '#f1f5f9',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '1.5rem',
                  lineHeight: '1.8'
                }}>
                  <li style={{ marginBottom: '1rem' }}>
                    <strong>Toca el botón de Compartir</strong>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: darkMode ? '#1e293b' : '#ffffff',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      marginTop: '0.5rem'
                    }}>
                      <FaShareSquare style={{ 
                        fontSize: '1.5rem',
                        color: '#3b82f6',
                        marginRight: '0.5rem'
                      }} />
                      <span>(cuadrado con flecha hacia arriba)</span>
                    </div>
                  </li>
                  <li style={{ marginBottom: '1rem' }}>
                    <strong>Desplázate y selecciona:</strong>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: darkMode ? '#1e293b' : '#ffffff',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      marginTop: '0.5rem'
                    }}>
                      <FaPlus style={{ 
                        fontSize: '1.5rem',
                        color: '#10b981',
                        marginRight: '0.5rem'
                      }} />
                      <span>"Añadir a pantalla de inicio"</span>
                    </div>
                  </li>
                  <li>
                    <strong>Toca "Añadir"</strong> en la esquina superior derecha
                  </li>
                </ol>
              </div>

              <div style={{ 
                background: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                border: `2px solid ${darkMode ? '#6366f1' : '#818cf8'}`,
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                💡 <strong>Consejo:</strong> Una vez instalada, la app aparecerá en tu pantalla de inicio como cualquier otra aplicación.
              </div>
            </div>
          ) : isAndroid && deferredPrompt ? (
            // Instalación automática para Android
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem',
                marginBottom: '1.5rem'
              }}>
                <FaAndroid style={{ color: '#10b981' }} />
              </div>
              
              <h5 style={{ 
                fontWeight: 600, 
                marginBottom: '1rem'
              }}>
                Instalación en Android
              </h5>
              
              <p style={{ 
                fontSize: '1.1rem',
                marginBottom: '2rem',
                color: darkMode ? '#cbd5e1' : '#64748b'
              }}>
                Haz clic en el botón para instalar la aplicación en tu dispositivo
              </p>

              <Button 
                variant="success" 
                size="lg"
                onClick={handleInstallAndroid}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                <FaDownload className="me-2" />
                Instalar Ahora
              </Button>
            </div>
          ) : isAndroid ? (
            // Instrucciones manuales para Android
            <div>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '1.5rem',
                fontSize: '3rem'
              }}>
                <FaAndroid style={{ color: '#10b981' }} />
              </div>
              
              <h5 style={{ 
                fontWeight: 600, 
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Instalación en Android
              </h5>
              
              <div style={{ 
                background: darkMode ? '#334155' : '#f1f5f9',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '1.5rem',
                  lineHeight: '1.8'
                }}>
                  <li style={{ marginBottom: '1rem' }}>
                    <strong>Abre el menú de Chrome</strong> (3 puntos verticales ⋮)
                  </li>
                  <li style={{ marginBottom: '1rem' }}>
                    <strong>Selecciona:</strong> "Instalar aplicación" o "Añadir a pantalla de inicio"
                  </li>
                  <li>
                    <strong>Confirma</strong> la instalación
                  </li>
                </ol>
              </div>

              <div style={{ 
                background: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                border: `2px solid ${darkMode ? '#10b981' : '#34d399'}`,
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                💡 <strong>Consejo:</strong> Podrás acceder a la app desde tu cajón de aplicaciones.
              </div>
            </div>
          ) : (
            // Otros navegadores
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem',
                marginBottom: '1.5rem'
              }}>
                🌐
              </div>
              
              <h5 style={{ 
                fontWeight: 600, 
                marginBottom: '1rem'
              }}>
                Instalación de la aplicación
              </h5>
              
              <p style={{ 
                fontSize: '1.1rem',
                color: darkMode ? '#cbd5e1' : '#64748b'
              }}>
                Busca la opción "Instalar" o "Añadir a pantalla de inicio" en el menú de tu navegador.
              </p>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{ 
          background: darkMode ? '#1e293b' : '#f8fafc',
          borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
        }}>
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default PWAInstallPrompt;