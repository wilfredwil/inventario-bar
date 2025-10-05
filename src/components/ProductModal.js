// src/components/ProductModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { FaBarcode, FaKeyboard } from 'react-icons/fa';
import { addDoc, updateDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function ProductModal({ show, onHide, editingItem, user, providers, categories }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    nombre: '',
    tipo: 'licor',
    stock: 0,
    precio_venta: 0,
    precio_compra: 0,
    unidad_medida: 'botella',
    umbral_low: 5,
    proveedor_id: '',
    notas: '',
    importante: false,
    codigo_barras: '',
    sku: '',
    upc: ''
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        marca: editingItem.marca || '',
        nombre: editingItem.nombre || '',
        tipo: editingItem.tipo || 'licor',
        stock: editingItem.stock || 0,
        precio_venta: editingItem.precio_venta || 0,
        precio_compra: editingItem.precio_compra || 0,
        unidad_medida: editingItem.unidad_medida || 'botella',
        umbral_low: editingItem.umbral_low || 5,
        proveedor_id: editingItem.proveedor_id || '',
        notas: editingItem.notas || '',
        importante: editingItem.importante || false,
        codigo_barras: editingItem.codigo_barras || '',
        sku: editingItem.sku || '',
        upc: editingItem.upc || ''
      });
    } else {
      setFormData({
        marca: '',
        nombre: '',
        tipo: 'licor',
        stock: 0,
        precio_venta: 0,
        precio_compra: 0,
        unidad_medida: 'botella',
        umbral_low: 5,
        proveedor_id: '',
        notas: '',
        importante: false,
        codigo_barras: '',
        sku: '',
        upc: ''
      });
    }
    setError('');
    setShowBarcodeScanner(false);
  }, [editingItem, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const itemData = {
        ...formData,
        tipo_inventario: 'bar',
        stock: parseFloat(formData.stock) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        umbral_low: parseFloat(formData.umbral_low) || 5,
        updated_at: serverTimestamp(),
        updated_by: user.email
      };

      if (editingItem) {
        await updateDoc(doc(db, 'inventario', editingItem.id), itemData);
        
        await addDoc(collection(db, 'historial'), {
          item_nombre: formData.nombre,
          usuario: user.email,
          tipo: 'edicion',
          fecha: serverTimestamp(),
          detalles: `Producto editado`,
          tipo_inventario: 'bar'
        });
      } else {
        await addDoc(collection(db, 'inventario'), {
          ...itemData,
          created_at: serverTimestamp(),
          created_by: user.email
        });

        await addDoc(collection(db, 'historial'), {
          item_nombre: formData.nombre,
          usuario: user.email,
          tipo: 'creacion',
          fecha: serverTimestamp(),
          detalles: `Producto creado`,
          tipo_inventario: 'bar'
        });
      }

      onHide();
    } catch (error) {
      console.error('Error guardando producto:', error);
      setError('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = (scannedCode) => {
    setFormData({...formData, codigo_barras: scannedCode});
    setShowBarcodeScanner(false);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? '✏️ Editar Producto' : '➕ Agregar Producto'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Marca</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({...formData, marca: e.target.value})}
                    placeholder="Ej: Alpasion"
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Producto *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Private selection Chacayas"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* SECCIÓN: Códigos de Identificación con Escáner */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Código de Barras</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({...formData, codigo_barras: e.target.value})}
                      placeholder="Ej: 7501234567890"
                    />
                    <Button 
                      variant="outline-success" 
                      onClick={() => setShowBarcodeScanner(true)}
                      title="Escanear código de barras"
                      type="button"
                    >
                      <FaBarcode />
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Click en 📊 para escanear
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>SKU</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    placeholder="Ej: ALP-001"
                  />
                  <Form.Text className="text-muted">
                    Código interno
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>UPC</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.upc}
                    onChange={(e) => setFormData({...formData, upc: e.target.value})}
                    placeholder="Ej: 012345678905"
                  />
                  <Form.Text className="text-muted">
                    Código UPC
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoría *</Form.Label>
                  <Form.Select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Actual *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Umbral Mínimo</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.umbral_low}
                    onChange={(e) => setFormData({...formData, umbral_low: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unidad de Medida</Form.Label>
                  <Form.Select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                  >
                    <option value="botella">Botella</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                    <option value="unidad">Unidad</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio de Venta</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({...formData, precio_venta: e.target.value})}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio de Compra</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.precio_compra}
                    onChange={(e) => setFormData({...formData, precio_compra: e.target.value})}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Proveedor</Form.Label>
              <Form.Select
                value={formData.proveedor_id}
                onChange={(e) => setFormData({...formData, proveedor_id: e.target.value})}
              >
                <option value="">Seleccionar proveedor...</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.empresa}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                placeholder="Notas adicionales..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Marcar como producto importante"
                checked={formData.importante}
                onChange={(e) => setFormData({...formData, importante: e.target.checked})}
              />
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={onHide} disabled={loading}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : editingItem ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal del Escáner Simple */}
      <BarcodeScannerSimple
        show={showBarcodeScanner}
        onHide={() => setShowBarcodeScanner(false)}
        onBarcodeDetected={handleBarcodeScanned}
      />
    </>
  );
}

// Componente de escáner simple que solo captura el código
function BarcodeScannerSimple({ show, onHide, onBarcodeDetected }) {
  const [manualCode, setManualCode] = useState('');
  const [scannerMode, setScannerMode] = useState('camera');
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (show && scannerMode === 'camera') {
      // Pequeño delay para asegurar que el DOM está listo
      const timer = setTimeout(() => {
        import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
          html5QrcodeScanner = new Html5QrcodeScanner(
            "barcode-input-reader",
            { 
              fps: 30, // Mayor velocidad de escaneo
              qrbox: { width: 300, height: 150 }, // Área optimizada para códigos de barras
              aspectRatio: 2.0,
              formatsToSupport: [
                0,  // CODE_128
                6,  // EAN_13 (más común)
                8,  // UPC_A
                9,  // UPC_E
                1,  // CODE_39
                5,  // EAN_8
                7,  // ITF
              ],
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              },
              rememberLastUsedCamera: true,
              showTorchButtonIfSupported: true
            },
            false
          );

          html5QrcodeScanner.render(
            (decodedText) => {
              console.log(`✅ Código capturado: ${decodedText}`);
              onBarcodeDetected(decodedText);
              if (html5QrcodeScanner) {
                html5QrcodeScanner.clear().catch(console.error);
              }
            },
            (errorMessage) => {
              // Ignorar errores de escaneo normal
              if (!errorMessage.includes('NotFoundException')) {
                console.warn('Error:', errorMessage);
              }
            }
          );
        }).catch(err => {
          console.error('Error cargando escáner:', err);
          setError('Error al cargar el escáner. Usa ingreso manual.');
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        if (html5QrcodeScanner) {
          html5QrcodeScanner.clear().catch(console.error);
        }
      };
    }
  }, [show, scannerMode, onBarcodeDetected]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError('Ingresa un código');
      return;
    }
    onBarcodeDetected(manualCode.trim());
    setManualCode('');
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
              id="barcode-input-reader" 
              style={{ 
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto'
              }}
            ></div>
            <p className="text-center text-muted mt-3">
              Apunta la cámara al código de barras
            </p>
          </div>
        ) : (
          <Form onSubmit={handleManualSubmit}>
            <Form.Group>
              <Form.Label>Código de Barras</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el código"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
                <Button type="submit" variant="primary">
                  Usar Código
                </Button>
              </InputGroup>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProductModal;