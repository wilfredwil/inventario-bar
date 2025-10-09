// src/components/InventoryList.js - CON TOAST
import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, InputGroup, Dropdown, ButtonGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaStar, FaRegStar, FaSearch, FaFilePdf, FaBarcode, FaMobileAlt } from 'react-icons/fa';
import { updateDoc, deleteDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ProductModal from './ProductModal';
import QuickStockMobile from './QuickStockMobile';
import BarcodeScanner from './BarcodeScanner';
import { generateInventoryPDF } from '../utils/pdfGenerator';
import { useToast } from './ToastNotification'; // <-- AGREGADO

function InventoryList({ inventory, user, userRole, providers }) {
  const toast = useToast(); // <-- AGREGADO
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  // REMOVIDOS: const [success, setSuccess] = useState('');
  // REMOVIDOS: const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [focusMode, setFocusMode] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [forceDesktopView, setForceDesktopView] = useState(false);

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'licor', label: 'Licores' },
    { value: 'vino', label: 'Vinos' },
    { value: 'cerveza', label: 'Cervezas' },
    { value: 'whisky', label: 'Whiskys' },
    { value: 'vodka', label: 'Vodkas' },
    { value: 'gin', label: 'Gins' },
    { value: 'ron', label: 'Rones' },
    { value: 'tequila', label: 'Tequilas' }
  ];

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      stockFilter === 'good' ? item.stock > (item.umbral_low || 5) : true;
    
    return matchesSearch && matchesCategory && matchesStock;
  });

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
    handleEditItem(product);
    toast.success(`Producto encontrado: ${product.nombre}`); // <-- CAMBIADO
  };

  const toggleView = () => {
    setForceDesktopView(!forceDesktopView);
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

      toast.success(`"${item.nombre}" eliminado correctamente`); // <-- CAMBIADO
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar el producto'); // <-- CAMBIADO
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
      
      toast.success(`Stock de ${item.nombre} actualizado`); // <-- CAMBIADO
    } catch (error) {
      console.error('Error actualizando stock:', error);
      toast.error('Error actualizando el stock'); // <-- CAMBIADO
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
      
      toast.success(`${item.nombre} ${!item.importante ? 'marcado' : 'desmarcado'} como importante`); // <-- AGREGADO
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar producto'); // <-- AGREGADO
    }
  };

  const generatePDF = (type) => {
    try {
      generateInventoryPDF(type, inventory, providers);
      toast.success('PDF generado correctamente'); // <-- AGREGADO
    } catch (error) {
      toast.error('Error al generar PDF'); // <-- AGREGADO
    }
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
      {/* REMOVIDO: Alerts de success y error */}
      
      {(isMobile && !forceDesktopView) ? (
        <QuickStockMobile 
          inventory={inventory}
          user={user}
          onToggleView={toggleView}
        />
      ) : (
        <>
          <h2 className="mb-4">📦 Inventario de Bar</h2>

          <Row className="mb-4">
            <Col md={3} sm={6} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-primary mb-1">{stats.total}</h3>
                  <small className="text-muted">Total Productos</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-warning mb-1">{stats.lowStock}</h3>
                  <small className="text-muted">Stock Bajo</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-danger mb-1">{stats.outOfStock}</h3>
                  <small className="text-muted">Sin Stock</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-info mb-1">{stats.important}</h3>
                  <small className="text-muted">Importantes</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="mb-3" style={{ overflow: 'visible' }}>
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
                  {isMobile && forceDesktopView && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={toggleView}
                      className="me-2"
                    >
                      <FaMobileAlt className="me-2" />
                      Vista Móvil
                    </Button>
                  )}

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
                        <tr key={item.id} className={item.importante ? 'important-product' : ''}>
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
                            </div>
                            {item.codigo_barras && (
                              <small className="text-muted">
                                Código: {item.codigo_barras}
                              </small>
                            )}
                          </td>
                          <td>
                            <Badge bg="secondary">
                              {item.tipo ? item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1) : 'N/A'}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Form.Control
                              type="number"
                              value={item.stock || 0}
                              onChange={(e) => handleQuickStockUpdate(item, e.target.value)}
                              style={{ 
                                width: '70px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: getStockColor(item),
                                fontSize: '1.1rem'
                              }}
                              min="0"
                              step="0.5"
                            />
                          </td>
                          <td>
                            {provider ? (
                              <small>{provider.empresa || provider.nombre}</small>
                            ) : (
                              <small className="text-muted">Sin proveedor</small>
                            )}
                          </td>
                          <td className="text-center">
                            {getStockBadge(item)}
                          </td>
                          <td className="text-end">
                            <ButtonGroup size="sm">
                              <Button 
                                variant="outline-primary" 
                                onClick={() => handleEditItem(item)}
                              >
                                <FaEdit />
                              </Button>
                              {(userRole === 'admin' || userRole === 'manager') && (
                                <Button 
                                  variant="outline-danger"
                                  onClick={() => handleDeleteItem(item)}
                                >
                                  <FaTrash />
                                </Button>
                              )}
                            </ButtonGroup>
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

      <ProductModal
        show={showModal}
        onHide={() => setShowModal(false)}
        editingItem={editingItem}
        user={user}
        providers={providers}
        categories={categories}
      />

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