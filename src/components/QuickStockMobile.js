// src/components/QuickStockMobile.js
import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Badge, Button, Modal, ListGroup, ButtonGroup, Alert, InputGroup } from 'react-bootstrap';
import { FaSearch, FaTimes, FaStar, FaCheck, FaMinus, FaPlus, FaBarcode, FaTable, FaList } from 'react-icons/fa';
import { updateDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import BarcodeScanner from './BarcodeScanner';

function QuickStockMobile({ inventory, user, onToggleView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [recentProducts, setRecentProducts] = useState([]);
  const [frequentProducts, setFrequentProducts] = useState([]);
  const searchInputRef = useRef(null);

  // Cargar productos frecuentes y recientes del localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentProducts') || '[]');
    const frequent = JSON.parse(localStorage.getItem('frequentProducts') || '{}');
    
    setRecentProducts(recent.slice(0, 5));
    
    // Convertir objeto de frecuencias a array ordenado
    const frequentArray = Object.entries(frequent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    
    setFrequentProducts(frequentArray);
  }, []);

  // Filtrar productos mientras escribes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = inventory
        .filter(item => 
          item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 10); // Solo mostrar 10 resultados
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, inventory]);

  // Guardar en productos recientes y frecuentes
  const saveToHistory = (productId) => {
    // Productos recientes
    let recent = JSON.parse(localStorage.getItem('recentProducts') || '[]');
    recent = recent.filter(id => id !== productId); // Remover si ya existe
    recent.unshift(productId); // Agregar al inicio
    recent = recent.slice(0, 10); // Mantener solo 10
    localStorage.setItem('recentProducts', JSON.stringify(recent));

    // Productos frecuentes (contador)
    let frequent = JSON.parse(localStorage.getItem('frequentProducts') || '{}');
    frequent[productId] = (frequent[productId] || 0) + 1;
    localStorage.setItem('frequentProducts', JSON.stringify(frequent));
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setNewStock(product.stock.toString());
    setShowModal(true);
    setSearchTerm('');
    setFilteredProducts([]);
  };

  const handleBarcodeDetected = (product) => {
    handleSelectProduct(product);
  };

  const handleBarcodeScannedForProduct = async (scannedCode) => {
    // Agregar código de barras al producto seleccionado
    if (!selectedProduct) return;

    try {
      await updateDoc(doc(db, 'inventario', selectedProduct.id), {
        codigo_barras: scannedCode,
        updated_at: serverTimestamp(),
        updated_by: user.email
      });

      await addDoc(collection(db, 'historial'), {
        item_nombre: selectedProduct.nombre,
        usuario: user.email,
        tipo: 'edicion',
        fecha: serverTimestamp(),
        detalles: `Código de barras agregado: ${scannedCode}`,
        tipo_inventario: 'bar'
      });

      // Actualizar el producto en el estado local
      selectedProduct.codigo_barras = scannedCode;
      
      // Cerrar escáner y volver al modal de stock
      setShowBarcodeScanner(false);
      setShowModal(true);

      // Vibración de feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error guardando código de barras:', error);
      alert('Error al guardar el código de barras');
    }
  };

  const handleQuickUpdate = async () => {
    if (!selectedProduct || !newStock) return;

    try {
      const stockValue = parseFloat(newStock);
      const previousStock = selectedProduct.stock || 0;

      await updateDoc(doc(db, 'inventario', selectedProduct.id), {
        previous_stock: previousStock,
        stock: stockValue,
        updated_at: serverTimestamp(),
        updated_by: user.email
      });

      await addDoc(collection(db, 'historial'), {
        item_nombre: selectedProduct.nombre,
        usuario: user.email,
        tipo: 'actualizacion_stock',
        fecha: serverTimestamp(),
        detalles: `Stock actualizado de ${previousStock} a ${stockValue}`,
        tipo_inventario: 'bar',
        stock_anterior: previousStock,
        stock_nuevo: stockValue
      });

      saveToHistory(selectedProduct.id);
      
      setShowModal(false);
      setSelectedProduct(null);
      setNewStock('');

      // Vibración de feedback (si está disponible)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error actualizando stock:', error);
      alert('Error al actualizar el stock');
    }
  };

  const adjustStock = (amount) => {
    const current = parseFloat(newStock) || 0;
    const adjusted = Math.max(0, current + amount);
    setNewStock(adjusted.toString());
  };

  const getStockColor = (stock, umbral) => {
    if (stock === 0) return '#ef4444';
    if (stock <= (umbral || 5)) return '#f59e0b';
    return '#10b981';
  };

  const getProductsByIds = (ids) => {
    return ids
      .map(id => inventory.find(item => item.id === id))
      .filter(item => item); // Filtrar nulls
  };

  const recentProductsList = getProductsByIds(recentProducts);
  const frequentProductsList = getProductsByIds(frequentProducts);

  return (
    <div className="quick-stock-mobile">
      {/* Header con botones de acción */}
      <Card className="mb-3" style={{ 
        position: 'sticky', 
        top: '60px', 
        zIndex: 100,
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Card.Body className="p-2">
          {/* Botones de acción superiores */}
          <div className="d-flex gap-2 mb-2">
            <Button 
              variant="success" 
              onClick={() => setShowBarcodeScanner(true)}
              className="flex-fill"
              style={{ 
                height: '48px',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: '10px'
              }}
            >
              <FaBarcode className="me-2" />
              Escanear
            </Button>
            
            <Button 
              variant="outline-primary" 
              onClick={onToggleView}
              style={{ 
                height: '48px',
                width: '48px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaTable size={18} />
            </Button>
          </div>

          {/* Búsqueda principal */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaSearch 
                style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  color: '#94a3b8',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} 
              />
              <Form.Control
                ref={searchInputRef}
                type="text"
                placeholder="Buscar producto, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                style={{
                  paddingLeft: '2.5rem',
                  paddingRight: searchTerm ? '2.5rem' : '1rem',
                  fontSize: '16px',
                  height: '50px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  boxShadow: searchTerm ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                  transition: 'all 0.2s'
                }}
              />
              {searchTerm && (
                <FaTimes
                  onClick={() => {
                    setSearchTerm('');
                    setFilteredProducts([]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                />
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Resultados de búsqueda */}
      {filteredProducts.length > 0 && (
        <Card className="mb-3" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <ListGroup variant="flush">
            {filteredProducts.map(product => (
              <ListGroup.Item
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                style={{
                  cursor: 'pointer',
                  padding: '1rem',
                  borderLeft: `4px solid ${getStockColor(product.stock, product.umbral_low)}`,
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                      {product.nombre}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {product.tipo} {product.codigo_barras && `• ${product.codigo_barras}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge 
                      bg={product.stock === 0 ? 'danger' : product.stock <= (product.umbral_low || 5) ? 'warning' : 'success'}
                      style={{ fontSize: '0.7rem' }}
                    >
                      Stock: {product.stock}
                    </Badge>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}

      {/* Productos recientes */}
      {!searchTerm && recentProductsList.length > 0 && (
        <Card className="mb-3">
          <Card.Header style={{ 
            background: '#f8fafc', 
            borderBottom: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#64748b',
            padding: '0.75rem 1rem'
          }}>
            <FaStar className="me-2" style={{ color: '#f59e0b' }} />
            Recientes
          </Card.Header>
          <ListGroup variant="flush">
            {recentProductsList.map(product => (
              <ListGroup.Item
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                style={{
                  cursor: 'pointer',
                  padding: '0.875rem 1rem',
                  borderLeft: `4px solid ${getStockColor(product.stock, product.umbral_low)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {product.nombre}
                    </div>
                    <Badge 
                      bg={product.stock === 0 ? 'danger' : product.stock <= (product.umbral_low || 5) ? 'warning' : 'success'}
                      style={{ fontSize: '0.7rem' }}
                    >
                      Stock: {product.stock}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>
                    Actualizar →
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}

      {/* Productos frecuentes */}
      {!searchTerm && frequentProductsList.length > 0 && (
        <Card className="mb-3">
          <Card.Header style={{ 
            background: '#f8fafc', 
            borderBottom: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#64748b',
            padding: '0.75rem 1rem'
          }}>
            📊 Más Usados
          </Card.Header>
          <ListGroup variant="flush">
            {frequentProductsList.map(product => (
              <ListGroup.Item
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                style={{
                  cursor: 'pointer',
                  padding: '0.875rem 1rem',
                  borderLeft: `4px solid ${getStockColor(product.stock, product.umbral_low)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {product.nombre}
                    </div>
                    <Badge 
                      bg={product.stock === 0 ? 'danger' : product.stock <= (product.umbral_low || 5) ? 'warning' : 'success'}
                      style={{ fontSize: '0.7rem' }}
                    >
                      Stock: {product.stock}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>
                    Actualizar →
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}

      {/* Modal de actualización rápida */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        centered
        fullscreen="sm-down"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0' }}>
          <Modal.Title style={{ fontSize: '1.125rem' }}>
            Actualizar Stock
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '1.5rem' }}>
          {selectedProduct && (
            <>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {selectedProduct.nombre}
                </h4>
                <Badge bg="secondary">{selectedProduct.tipo}</Badge>
                {selectedProduct.importante && (
                  <Badge bg="warning" className="ms-2">
                    <FaStar /> Importante
                  </Badge>
                )}
                
                {/* Mostrar código de barras si existe, o botón para agregarlo */}
                {selectedProduct.codigo_barras ? (
                  <div style={{ 
                    marginTop: '0.75rem',
                    fontSize: '0.85rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaBarcode />
                    {selectedProduct.codigo_barras}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.75rem' }}>
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => {
                        // Guardar el producto seleccionado y abrir escáner
                        setShowModal(false);
                        setShowBarcodeScanner(true);
                      }}
                    >
                      <FaBarcode className="me-1" />
                      Agregar Código de Barras
                    </Button>
                  </div>
                )}
              </div>

              <div style={{ 
                background: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '12px',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Stock Actual
                </div>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 700,
                  color: getStockColor(selectedProduct.stock, selectedProduct.umbral_low)
                }}>
                  {selectedProduct.stock}
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                  Botones rápidos:
                </Form.Label>
                <div className="d-grid gap-2">
                  <ButtonGroup>
                    <Button 
                      variant="outline-danger"
                      onClick={() => adjustStock(-10)}
                      style={{ height: '50px', fontSize: '1.125rem' }}
                    >
                      -10
                    </Button>
                    <Button 
                      variant="outline-danger"
                      onClick={() => adjustStock(-1)}
                      style={{ height: '50px', fontSize: '1.125rem' }}
                    >
                      <FaMinus />
                    </Button>
                    <Button 
                      variant="outline-success"
                      onClick={() => adjustStock(1)}
                      style={{ height: '50px', fontSize: '1.125rem' }}
                    >
                      <FaPlus />
                    </Button>
                    <Button 
                      variant="outline-success"
                      onClick={() => adjustStock(10)}
                      style={{ height: '50px', fontSize: '1.125rem' }}
                    >
                      +10
                    </Button>
                  </ButtonGroup>
                </div>
              </Form.Group>

              <Form.Group>
                <Form.Label style={{ fontWeight: 600, marginBottom: 0, fontSize: '0.875rem' }}>
                  O ingresa el nuevo stock:
                </Form.Label>
                <Form.Control
                  type="number"
                  inputMode="decimal"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    height: '60px',
                    borderRadius: '12px',
                    border: '2px solid #6366f1'
                  }}
                  autoFocus
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e2e8f0', padding: '1rem' }}>
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
            style={{ flex: 1, height: '50px', fontSize: '1rem', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleQuickUpdate}
            style={{ flex: 2, height: '50px', fontSize: '1rem', fontWeight: 600 }}
          >
            <FaCheck className="me-2" />
            Actualizar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Escáner de Código de Barras */}
      <BarcodeScanner
        show={showBarcodeScanner}
        onHide={() => {
          setShowBarcodeScanner(false);
          // Si hay un producto seleccionado, volver al modal de stock
          if (selectedProduct) {
            setShowModal(true);
          }
        }}
        onBarcodeDetected={handleBarcodeDetected}
        inventory={inventory}
      />

      {/* Modal de Escáner Simple para Agregar Código */}
      <BarcodeScannerSimple
        show={showBarcodeScanner && selectedProduct && !selectedProduct.codigo_barras}
        onHide={() => {
          setShowBarcodeScanner(false);
          setShowModal(true);
        }}
        onBarcodeDetected={handleBarcodeScannedForProduct}
      />

      <style>{`
        .quick-stock-mobile .list-group-item:active {
          background-color: #f1f5f9;
        }
        
        .quick-stock-mobile input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
        }

        .quick-stock-mobile .btn:active {
          transform: scale(0.98);
        }

        /* Scroll suave */
        .quick-stock-mobile * {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}

// Componente simple para escanear código sin buscar en inventario
function BarcodeScannerSimple({ show, onHide, onBarcodeDetected }) {
  const [manualCode, setManualCode] = useState('');
  const [scannerMode, setScannerMode] = useState('camera');
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (show && scannerMode === 'camera') {
      const timer = setTimeout(() => {
        import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
          html5QrcodeScanner = new Html5QrcodeScanner(
            "barcode-simple-reader",
            { 
              fps: 30, // Mayor velocidad
              qrbox: { width: 300, height: 150 }, // Mejor para códigos de barras
              aspectRatio: 2.0,
              formatsToSupport: [
                0,  // CODE_128
                6,  // EAN_13
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
    <Modal show={show} onHide={handleClose} size="lg" centered fullscreen="sm-down">
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
            Ingreso Manual
          </Button>
        </div>

        {scannerMode === 'camera' ? (
          <div>
            <div 
              id="barcode-simple-reader" 
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
                  Guardar
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

export default QuickStockMobile;