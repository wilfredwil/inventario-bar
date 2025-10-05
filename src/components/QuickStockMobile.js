// src/components/QuickStockMobile.js
import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Badge, Button, Modal, ListGroup } from 'react-bootstrap';
import { FaSearch, FaTimes, FaStar, FaCheck, FaMinus, FaPlus } from 'react-icons/fa';
import { updateDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function QuickStockMobile({ inventory, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [showModal, setShowModal] = useState(false);
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
          item.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Búsqueda principal */}
      <Card className="mb-3" style={{ 
        position: 'sticky', 
        top: '70px', 
        zIndex: 100,
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Card.Body className="p-2" style={{ background: '#ffffff' }}>
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
                placeholder="Buscar producto..."
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
                  boxShadow: searchTerm ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                }}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Resultados de búsqueda */}
            {filteredProducts.length > 0 && (
              <Card 
                className="mt-2"
                style={{
                  position: 'absolute',
                  width: '100%',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                  borderRadius: '12px'
                }}
              >
                <ListGroup variant="flush">
                  {filteredProducts.map(product => (
                    <ListGroup.Item
                      key={product.id}
                      action
                      onClick={() => handleSelectProduct(product)}
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${getStockColor(product.stock, product.umbral_low)}`
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                            {product.nombre}
                            {product.importante && (
                              <FaStar className="ms-2" style={{ color: '#f59e0b', fontSize: '0.8rem' }} />
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
                              {product.tipo}
                            </Badge>
                            <span className="ms-2">{product.unidad_medida}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div 
                            style={{ 
                              fontSize: '1.25rem', 
                              fontWeight: 700,
                              color: getStockColor(product.stock, product.umbral_low)
                            }}
                          >
                            {product.stock}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            en stock
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Productos frecuentes */}
      {frequentProductsList.length > 0 && !searchTerm && (
        <Card className="mb-3">
          <Card.Header style={{ background: '#f8fafc', fontWeight: 600, fontSize: '0.875rem', padding: '0.75rem 1rem' }}>
            🔥 Productos Más Usados
          </Card.Header>
          <ListGroup variant="flush">
            {frequentProductsList.map(product => (
              <ListGroup.Item
                key={product.id}
                action
                onClick={() => handleSelectProduct(product)}
                style={{ padding: '0.875rem 1rem' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.nombre}</div>
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

      {/* Productos recientes */}
      {recentProductsList.length > 0 && !searchTerm && (
        <Card className="mb-3">
          <Card.Header style={{ background: '#f8fafc', fontWeight: 600, fontSize: '0.875rem', padding: '0.75rem 1rem' }}>
            🕒 Actualizados Recientemente
          </Card.Header>
          <ListGroup variant="flush">
            {recentProductsList.map(product => (
              <ListGroup.Item
                key={product.id}
                action
                onClick={() => handleSelectProduct(product)}
                style={{ padding: '0.875rem 1rem' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.nombre}</div>
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
                  fontSize: '2rem', 
                  fontWeight: 700,
                  color: getStockColor(selectedProduct.stock, selectedProduct.umbral_low)
                }}>
                  {selectedProduct.stock} {selectedProduct.unidad_medida}
                </div>
              </div>

              {/* Botones de ajuste rápido */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  Ajuste Rápido:
                </div>
                <div className="d-flex gap-2 mb-3">
                  <Button 
                    variant="outline-danger" 
                    onClick={() => adjustStock(-10)}
                    style={{ flex: 1, height: '50px', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    -10
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => adjustStock(-1)}
                    style={{ flex: 1, height: '50px', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    -1
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => adjustStock(1)}
                    style={{ flex: 1, height: '50px', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    +1
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => adjustStock(10)}
                    style={{ flex: 1, height: '50px', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    +10
                  </Button>
                </div>
              </div>

              {/* Input manual */}
              <Form.Group>
                <Form.Label style={{ fontWeight: 600, fontSize: '0.875rem' }}>
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

export default QuickStockMobile;