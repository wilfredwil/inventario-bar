// src/components/BarcodeScanner.js
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, Form, InputGroup, Badge, Spinner } from 'react-bootstrap';
import { FaBarcode, FaKeyboard, FaTimes, FaCamera, FaVideo } from 'react-icons/fa';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

function BarcodeScanner({ show, onHide, onBarcodeDetected, inventory }) {
  const [manualCode, setManualCode] = useState('');
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera', 'photo', 'manual'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const html5QrcodeScannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  // Vibración fuerte cuando detecta código
  const vibrateSuccess = () => {
    if (navigator.vibrate) {
      // Patrón: vibrar 200ms, pausa 100ms, vibrar 200ms
      navigator.vibrate([200, 100, 200]);
    }
  };

  // Limpiar escáneres al cerrar
  useEffect(() => {
    return () => {
      // Cleanup cuando el componente se desmonta - sin async para evitar race conditions
      setTimeout(() => {
        if (html5QrcodeRef.current && (isScanning || isCameraReady)) {
          html5QrcodeRef.current.stop().catch(() => {});
        }
        
        if (html5QrcodeScannerRef.current) {
          html5QrcodeScannerRef.current.clear().catch(() => {});
        }
      }, 0);
    };
  }, [isScanning, isCameraReady]);

  // Modo escáner continuo (video)
  useEffect(() => {
    if (show && scannerMode === 'camera') {
      const timer = setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            "barcode-reader",
            { 
              fps: 10,
              qrbox: { width: 280, height: 140 },
              aspectRatio: 2.0,
              formatsToSupport: [
                0,  // CODE_128
                1,  // CODE_39
                6,  // EAN_13
                8,  // UPC_A
                9,  // UPC_E
                5,  // EAN_8
                7,  // ITF
              ],
              showTorchButtonIfSupported: true,
              rememberLastUsedCamera: true,
              videoConstraints: {
                facingMode: "environment"
              }
            },
            false
          );

          scanner.render(
            (decodedText) => {
              console.log(`✅ Código detectado: ${decodedText}`);
              vibrateSuccess(); // ¡VIBRACIÓN FUERTE!
              handleCodeDetected(decodedText);
              // Limpiar de forma segura
              try {
                scanner.clear();
              } catch (err) {
                console.log('Info: Escáner limpiado automáticamente');
              }
            },
            (errorMessage) => {
              // Ignorar errores comunes de escaneo
              if (!errorMessage.includes('NotFoundException') && 
                  !errorMessage.includes('IndexSizeError') &&
                  !errorMessage.includes('getImageData')) {
                console.warn('Error de escaneo:', errorMessage);
              }
            }
          );

          html5QrcodeScannerRef.current = scanner;
        } catch (err) {
          console.error('Error inicializando escáner:', err);
          setError('Error al iniciar el escáner. Intenta con modo Manual.');
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (html5QrcodeScannerRef.current) {
          try {
            html5QrcodeScannerRef.current.clear();
          } catch (err) {
            // Ignorar errores de limpieza
          }
        }
      };
    }
  }, [show, scannerMode, inventory]);

  // Función para procesar código detectado
  const handleCodeDetected = (decodedText) => {
    const foundProduct = inventory.find(item => 
      item.codigo_barras === decodedText || 
      item.sku === decodedText ||
      item.upc === decodedText
    );

    if (foundProduct) {
      setSuccess(`✅ Producto encontrado: ${foundProduct.nombre}`);
      setTimeout(() => {
        onBarcodeDetected(foundProduct);
        handleClose();
      }, 500);
    } else {
      setError(`❌ No se encontró producto con código: ${decodedText}`);
      vibrateSuccess(); // Vibrar aunque no se encuentre
      setTimeout(() => setError(''), 3000);
    }
  };

  // Iniciar cámara para modo foto
  const startPhotoCamera = async () => {
    if (isCameraReady) return;
    
    setError('');
    setSuccess('');
    setIsScanning(true);

    try {
      const html5Qrcode = new Html5Qrcode("photo-reader");
      html5QrcodeRef.current = html5Qrcode;

      // Configuración de la cámara
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 140 },
        aspectRatio: 2.0
      };

      // Callback requerido pero ignorado (procesamos manualmente al capturar)
      const qrCodeSuccessCallback = (decodedText) => {
        // No hacer nada - esperamos captura manual
      };

      const qrCodeErrorCallback = (error) => {
        // Ignorar errores de escaneo continuo
      };

      // Iniciar cámara
      await html5Qrcode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );

      setIsCameraReady(true);
      setIsScanning(false);
      setSuccess('📸 Cámara lista - Enfoca el código y presiona CAPTURAR');
    } catch (err) {
      console.error('Error iniciando cámara:', err);
      setError('Error al acceder a la cámara. Verifica los permisos.');
      setIsScanning(false);
    }
  };

  // Capturar foto y procesar
  const capturePhoto = async () => {
    if (!html5QrcodeRef.current || !isCameraReady || isProcessing) return;

    setIsProcessing(true);
    setError('');
    setSuccess('🔍 Procesando imagen...');

    try {
      // Obtener el elemento de video
      const videoElement = document.getElementById('photo-reader')?.querySelector('video');
      
      if (!videoElement) {
        throw new Error('No se encontró la cámara');
      }

      // Crear canvas para capturar la imagen
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convertir canvas a archivo
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // Procesar la imagen con Html5Qrcode
      const html5QrcodeScanner = new Html5Qrcode("temp-scanner");
      
      try {
        const decodedText = await html5QrcodeScanner.scanFile(
          dataURLtoFile(imageDataUrl, 'capture.png'),
          true
        );
        
        console.log(`📸 Código capturado de foto: ${decodedText}`);
        vibrateSuccess(); // ¡VIBRACIÓN FUERTE!
        
        // Detener cámara primero
        await stopPhotoCamera();
        
        // Procesar código
        handleCodeDetected(decodedText);
        
      } catch (scanErr) {
        console.error('No se pudo leer el código:', scanErr);
        setError('❌ No se detectó ningún código. Intenta de nuevo con mejor enfoque.');
        setIsProcessing(false);
        setSuccess('');
      }
      
    } catch (err) {
      console.error('Error capturando foto:', err);
      setError('Error al capturar la foto. Intenta de nuevo.');
      setIsProcessing(false);
      setSuccess('');
    }
  };

  // Convertir dataURL a File
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Detener cámara de foto
  const stopPhotoCamera = async () => {
    if (html5QrcodeRef.current && (isCameraReady || isScanning)) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        // Ignorar - ya detenido
      } finally {
        setIsCameraReady(false);
        setIsScanning(false);
        setSuccess('');
      }
    } else {
      setIsCameraReady(false);
      setIsScanning(false);
      setSuccess('');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    
    if (!manualCode.trim()) {
      setError('Ingresa un código');
      return;
    }

    const foundProduct = inventory.find(item => 
      item.codigo_barras === manualCode.trim() || 
      item.sku === manualCode.trim() ||
      item.upc === manualCode.trim()
    );

    if (foundProduct) {
      vibrateSuccess();
      onBarcodeDetected(foundProduct);
      handleClose();
    } else {
      setError(`No se encontró producto con código: ${manualCode}`);
    }
  };

  const handleClose = async () => {
    // Limpiar cámara de foto
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        // Ignorar si ya está detenido
      }
    }
    
    // Limpiar escáner de video
    if (html5QrcodeScannerRef.current) {
      try {
        await html5QrcodeScannerRef.current.clear();
      } catch (err) {
        // Ignorar si ya está limpiado
      }
    }
    
    // Resetear estados
    setManualCode('');
    setError('');
    setSuccess('');
    setIsScanning(false);
    setIsCameraReady(false);
    setIsProcessing(false);
    setScannerMode('camera');
    
    // Cerrar modal
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #e2e8f0' }}>
        <Modal.Title>
          <FaBarcode className="me-2" style={{ color: '#6366f1' }} />
          Escanear Código de Barras
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Selector de modo mejorado */}
        <div className="d-flex gap-2 mb-3 justify-content-center">
          <Button
            variant={scannerMode === 'camera' ? 'primary' : 'outline-primary'}
            onClick={async () => {
              await stopPhotoCamera();
              // Limpiar escáner previo antes de cambiar
              if (html5QrcodeScannerRef.current) {
                try {
                  await html5QrcodeScannerRef.current.clear();
                  html5QrcodeScannerRef.current = null;
                } catch (err) {
                  // Ignorar
                }
              }
              setScannerMode('camera');
            }}
            disabled={isProcessing}
            style={{ 
              flex: 1,
              height: '50px',
              fontWeight: 600,
              borderRadius: '10px'
            }}
          >
            <FaVideo className="me-2" />
            Video
          </Button>
          <Button
            variant={scannerMode === 'photo' ? 'primary' : 'outline-primary'}
            onClick={async () => {
              // Limpiar escáner de video antes de cambiar a foto
              if (html5QrcodeScannerRef.current) {
                try {
                  await html5QrcodeScannerRef.current.clear();
                  html5QrcodeScannerRef.current = null;
                } catch (err) {
                  // Ignorar
                }
              }
              setScannerMode('photo');
            }}
            disabled={isProcessing}
            style={{ 
              flex: 1,
              height: '50px',
              fontWeight: 600,
              borderRadius: '10px'
            }}
          >
            <FaCamera className="me-2" />
            Foto
          </Button>
          <Button
            variant={scannerMode === 'manual' ? 'primary' : 'outline-primary'}
            onClick={async () => {
              await stopPhotoCamera();
              setScannerMode('manual');
            }}
            disabled={isProcessing}
            style={{ 
              flex: 1,
              height: '50px',
              fontWeight: 600,
              borderRadius: '10px'
            }}
          >
            <FaKeyboard className="me-2" />
            Manual
          </Button>
        </div>

        {/* Modo Video (escaneo continuo) */}
        {scannerMode === 'camera' && (
          <div>
            <div 
              id="barcode-reader" 
              style={{ 
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            ></div>
            <div className="text-center mt-3">
              <Badge bg="info" className="p-2">
                💡 Mantén el código dentro del cuadro
              </Badge>
            </div>
          </div>
        )}

        {/* Modo Foto (captura manual) */}
        {scannerMode === 'photo' && (
          <div>
            <div 
              id="photo-reader" 
              style={{ 
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto',
                borderRadius: '12px',
                overflow: 'hidden',
                minHeight: isCameraReady ? '300px' : '0',
                background: '#000'
              }}
            ></div>
            
            {!isCameraReady && !isScanning ? (
              <div className="text-center">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={startPhotoCamera}
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    height: '60px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    marginTop: '1rem'
                  }}
                >
                  <FaCamera className="me-2" />
                  Activar Cámara
                </Button>
                <p className="text-muted mt-3">
                  📸 Captura una foto del código
                  <br />
                  Ideal para códigos difíciles de leer
                </p>
              </div>
            ) : isScanning ? (
              <div className="text-center mt-3">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2">Iniciando cámara...</p>
              </div>
            ) : (
              <div className="text-center mt-3">
                <Badge bg="success" className="p-2 mb-3">
                  🎯 Enfoca bien el código de barras
                </Badge>
                <br />
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={capturePhoto}
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    height: '60px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    marginBottom: '1rem'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaCamera className="me-2" />
                      📸 CAPTURAR FOTO
                    </>
                  )}
                </Button>
                <br />
                <Button 
                  variant="outline-danger"
                  onClick={stopPhotoCamera}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Modo Manual */}
        {scannerMode === 'manual' && (
          <Form onSubmit={handleManualSubmit}>
            <Form.Group>
              <Form.Label style={{ fontWeight: 600 }}>
                Código de Barras / SKU
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el código manualmente"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                  style={{
                    height: '50px',
                    fontSize: '1rem',
                    borderRadius: '10px 0 0 10px'
                  }}
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  style={{
                    height: '50px',
                    fontWeight: 600,
                    borderRadius: '0 10px 10px 0'
                  }}
                >
                  Buscar
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                ⌨️ Ingresa el código de barras, SKU o UPC del producto
              </Form.Text>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer style={{ borderTop: '1px solid #e2e8f0' }}>
        <Button 
          variant="secondary" 
          onClick={handleClose}
          disabled={isProcessing}
          style={{
            height: '45px',
            fontWeight: 600,
            borderRadius: '10px'
          }}
        >
          <FaTimes className="me-2" />
          Cancelar
        </Button>
      </Modal.Footer>

      {/* Elemento temporal para escaneo de archivo */}
      <div id="temp-scanner" style={{ display: 'none' }}></div>
    </Modal>
  );
}

export default BarcodeScanner;