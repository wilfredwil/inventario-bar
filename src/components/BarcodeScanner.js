// src/components/BarcodeScanner.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Form, InputGroup } from 'react-bootstrap';
import { FaBarcode, FaKeyboard, FaTimes } from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';

function BarcodeScanner({ show, onHide, onBarcodeDetected, inventory }) {
  const [manualCode, setManualCode] = useState('');
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera' o 'manual'
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (show && scannerMode === 'camera') {
      // Delay para asegurar que el DOM está montado
      const timer = setTimeout(() => {
        import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
          html5QrcodeScanner = new Html5QrcodeScanner(
            "barcode-reader",
            { 
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              formatsToSupport: [
                // Códigos de barras comunes
                0,  // CODE_128
                1,  // CODE_39
                2,  // CODE_93
                3,  // CODABAR
                5,  // EAN_8
                6,  // EAN_13
                7,  // ITF
                8,  // UPC_A
                9,  // UPC_E
              ]
            },
            false
          );

          html5QrcodeScanner.render(
            (decodedText) => {
              console.log(`Código escaneado: ${decodedText}`);
              
              // Buscar producto en inventario
              const foundProduct = inventory.find(item => 
                item.codigo_barras === decodedText || 
                item.sku === decodedText ||
                item.upc === decodedText
              );

              if (foundProduct) {
                onBarcodeDetected(foundProduct);
                handleClose();
              } else {
                setError(`No se encontró producto con código: ${decodedText}`);
                setTimeout(() => setError(''), 3000);
              }

              // Limpiar escáner después de detectar
              if (html5QrcodeScanner) {
                html5QrcodeScanner.clear().catch(console.error);
              }
            },
            (errorMessage) => {
              // No mostrar errores de escaneo continuos
              if (!errorMessage.includes('NotFoundException')) {
                console.warn('Error de escaneo:', errorMessage);
              }
            }
          );
        }).catch(err => {
          console.error('Error cargando escáner:', err);
          setError('Error al cargar el escáner. Intenta con ingreso manual.');
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        if (html5QrcodeScanner) {
          html5QrcodeScanner.clear().catch(console.error);
        }
      };
    }
  }, [show, scannerMode, inventory, onBarcodeDetected]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    
    if (!manualCode.trim()) {
      setError('Ingresa un código');
      return;
    }

    // Buscar producto en inventario
    const foundProduct = inventory.find(item => 
      item.codigo_barras === manualCode.trim() || 
      item.sku === manualCode.trim() ||
      item.upc === manualCode.trim()
    );

    if (foundProduct) {
      onBarcodeDetected(foundProduct);
      handleClose();
    } else {
      setError(`No se encontró producto con código: ${manualCode}`);
    }
  };

  const handleClose = () => {
    setManualCode('');
    setError('');
    setScannerMode('camera');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaBarcode className="me-2" />
          Escanear Código de Barras
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="warning" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Selector de modo */}
        <div className="text-center mb-3">
          <Button
            variant={scannerMode === 'camera' ? 'primary' : 'outline-primary'}
            className="me-2"
            onClick={() => setScannerMode('camera')}
          >
            <FaBarcode className="me-1" /> Escanear
          </Button>
          <Button
            variant={scannerMode === 'manual' ? 'primary' : 'outline-primary'}
            onClick={() => setScannerMode('manual')}
          >
            <FaKeyboard className="me-1" /> Ingreso Manual
          </Button>
        </div>

        {scannerMode === 'camera' ? (
          <div>
            <div 
              id="barcode-reader" 
              style={{ 
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto'
              }}
            ></div>
            <p className="text-center text-muted mt-3">
              Apunta la cámara al código de barras del producto
            </p>
          </div>
        ) : (
          <Form onSubmit={handleManualSubmit}>
            <Form.Group>
              <Form.Label>Código de Barras / SKU</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el código manualmente"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
                <Button type="submit" variant="primary">
                  Buscar
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                Ingresa el código de barras, SKU o UPC del producto
              </Form.Text>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          <FaTimes className="me-1" /> Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BarcodeScanner;