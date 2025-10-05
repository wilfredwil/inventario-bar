// src/components/InventoryList.js
import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, InputGroup, Alert, Dropdown, ButtonGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaStar, FaRegStar, FaSearch, FaFilePdf, FaBarcode } from 'react-icons/fa';
import { updateDoc, deleteDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ProductModal from './ProductModal';
import QuickStockMobile from './QuickStockMobile';
import BarcodeScanner from './BarcodeScanner';
import { generateInventoryPDF } from '../utils/pdfGenerator';

function InventoryList({ inventory, user, userRole, providers }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [focusMode, setFocusMode] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'licor', label: 'Licores' },
    { value: 'vino', label: 'Vinos' },
    { value: 'cerveza', label: 'Cervezas' },
    { value: 'whiskey', label: 'Whiskeys' },
    { value: 'vodka', label: 'Vodkas' },
    { value: 'gin', label: 'Gins' },
    { value: 'ron', label: 'Rones' },
    { value: 'tequila', label: 'Tequilas' }
  ];

  // Detectar cambios de tamaño de pantalla
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar inventario
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.tipo === categoryFilter;
    const matchesStock = 
      stockFilter === 'all' ? true :
      stockFilter === 'low' ? (item.stock <= (item.umbral_low || 5) && item.stock > 0) :
      stockFilter === 'out' ? item.stock === 0 :
      stockFilter === 'good' ? item.stock > (item.umbral_low || 5) :
      true;
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Estadísticas rápidas
  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(i => i.stock <= (i.umbral_low || 5) && i.stock > 0).length,
    outOfStock: inventory.filter(i => i.stock === 0).length,
    important: inventory.filter(i => i.importante).length
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleBarcodeDetected = (product) => {
    // Abrir modal de edición del producto encontrado
    handleEditItem(product);
    setSuccess(`Producto encontrado: ${product.nombre}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${item.nombre}"?`)) return;

    try {
      await deleteDoc(doc(db, 'inventario', item.id));
      
      await addDoc(collection(db, 'historial'), {
        item_nombre: item.nombre,
        usuario: user.email,
        tipo: 'eliminacion',
        fecha: serverTimestamp(),
        detalles: `Producto eliminado del inventario`,
        tipo_inventario: 'bar'
      });

      setSuccess(`"${item.nombre}" eliminado correctamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setError('Error al eliminar el producto');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleQuickStockUpdate = async (item, newStock) => {
    try {
      const stockValue = parseFloat(newStock);
      const previousStock = item.stock || 0;

      await updateDoc(doc(db, 'inventario', item.id), {
        previous_stock: previousStock,
        stock: stockValue,
        updated_at: serverTimestamp(),
        updated_by: user.email
      });

      await addDoc(collection(db, 'historial'), {
        item_nombre: item.nombre,
        usuario: user.email,
        tipo: 'actualizacion_stock',
        fecha: serverTimestamp(),
        detalles: `Stock actualizado de ${previousStock} a ${stockValue}`,
        tipo_inventario: 'bar',
        stock_anterior: previousStock,
        stock_nuevo: stockValue
      });
      
      setSuccess(`Stock de ${item.nombre} actualizado`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error actualizando stock:', error);
      setError('Error actualizando el stock');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleToggleImportante = async (item) => {
    try {
      await updateDoc(doc(db, 'inventario', item.id), {
        importante: !item.importante,
        updated_at: serverTimestamp()
      });
      
      await addDoc(collection(db, 'historial'), {
        item_nombre: item.nombre,
        usuario: user.email,
        tipo: 'marca_importante',
        fecha: serverTimestamp(),
        detalles: `Producto ${!item.importante ? 'marcado' : 'desmarcado'} como importante`,
        tipo_inventario: 'bar'
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generatePDF = (type) => {
    generateInventoryPDF(type, inventory, providers);
  };

  const getStockBadge = (item) => {
    if (item.stock === 0) return <Badge bg="danger">Sin Stock</Badge>;
    if (item.stock <= (item.umbral_low || 5)) return <Badge bg="warning" text="dark">Stock Bajo</Badge>;
    return <Badge bg="success">OK</Badge>;
  };

  const getStockColor = (item) => {
    if (item.stock === 0) return '#dc3545';
    if (item.stock <= (item.umbral_low || 5)) return '#ffc107';
    return '#28a745';
  };

  return (
    <>
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Vista móvil optimizada */}
      {isMobile ? (
        <QuickStockMobile inventory={inventory} user={user} />
      ) : (
        <>
          {/* Estadísticas rápidas */}
          <Row className="mb-4">
            <Col md={3} sm={6} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-primary">{stats.total}</h3>
                  <small className="text-muted">Total Productos</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-warning">{stats.lowStock}</h3>
                  <small className="text-muted">Stock Bajo</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-danger">{stats.outOfStock}</h3>
                  <small className="text-muted">Sin Stock</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-info">{stats.important}</h3>
                  <small className="text-muted">Importantes</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Controles */}
          <Card className="mb-4" style={{ overflow: 'visible' }}>
            <Card.Body style={{ overflow: 'visible' }}>
              <Row className="align-items-center">
                <Col md={4} className="mb-3 mb-md-0">
                  <InputGroup>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar producto, código, SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>

                <Col md={8} className="text-md-end">
                  {/* Botón de Escáner - NUEVO */}
                  <Button 
                    variant="success" 
                    onClick={() => setShowBarcodeScanner(true)}
                    className="me-2"
                  >
                    <FaBarcode className="me-2" />
                    Escanear
                  </Button>

                  <Button variant="primary" onClick={handleAddItem} className="me-2">
                    <FaPlus className="me-2" />
                    Agregar Producto
                  </Button>

                  <Dropdown as={ButtonGroup}>
                    <Dropdown.Toggle variant="secondary" id="dropdown-pdf">
                      <FaFilePdf className="me-2" />
                      Reportes PDF
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => generatePDF('complete')}>
                        Inventario Completo
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('low-stock')}>
                        Stock Bajo
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('out-of-stock')}>
                        Sin Stock
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('critical')}>
                        Stock Crítico
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => generatePDF('by-category')}>
                        Por Categoría
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('by-provider')}>
                        Por Proveedor
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('valuation')}>
                        Valoración
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                  >
                    <option value="all">Todos los niveles de stock</option>
                    <option value="good">Stock Normal</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabla de inventario */}
          <Card>
            <Card.Body className="p-0">
              <Table hover responsive>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="text-center">Stock</th>
                    <th>Proveedor</th>
                    <th className="text-center">Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all' 
                          ? 'No se encontraron productos con los filtros aplicados'
                          : 'No hay productos en el inventario'}
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => {
                      const provider = providers.find(p => p.id === item.proveedor_id);
                      return (
                        <tr key={item.id}>
                          <td className="text-center">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleToggleImportante(item)}
                              className="p-0"
                            >
                              {item.importante ? 
                                <FaStar className="text-warning" /> : 
                                <FaRegStar className="text-muted" />
                              }
                            </Button>
                          </td>
                          <td>
                            <div>
                              <strong>{item.marca ? `${item.marca} - ` : ''}{item.nombre}</strong>
                              {item.codigo_barras && (
                                <div className="text-muted small">
                                  <FaBarcode className="me-1" />
                                  {item.codigo_barras}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg="info">
                              {categories.find(c => c.value === item.tipo)?.label || item.tipo}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={item.stock}
                              onChange={(e) => handleQuickStockUpdate(item, e.target.value)}
                              style={{
                                width: '80px',
                                display: 'inline-block',
                                borderColor: getStockColor(item),
                                fontWeight: 'bold'
                              }}
                            />
                          </td>
                          <td>
                            <small className="text-muted">
                              {provider?.empresa || 'Sin proveedor'}
                            </small>
                          </td>
                          <td className="text-center">
                            {getStockBadge(item)}
                          </td>
                          <td className="text-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              className="me-1"
                            >
                              <FaEdit />
                            </Button>
                            {userRole === 'admin' && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteItem(item)}
                              >
                                <FaTrash />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Modal de Producto */}
      <ProductModal
        show={showModal}
        onHide={() => setShowModal(false)}
        editingItem={editingItem}
        user={user}
        providers={providers}
        categories={categories}
      />

      {/* Modal de Escáner de Código de Barras - NUEVO */}
      <BarcodeScanner
        show={showBarcodeScanner}
        onHide={() => setShowBarcodeScanner(false)}
        onBarcodeDetected={handleBarcodeDetected}
        inventory={inventory}
      />
    </>
  );
}

export default InventoryList;