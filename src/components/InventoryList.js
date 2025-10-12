// src/components/InventoryList.js
import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, InputGroup, Dropdown, ButtonGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaStar, FaRegStar, FaSearch, FaFilePdf, FaBarcode, FaMobileAlt } from 'react-icons/fa';
import { updateDoc, deleteDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ProductModal from './ProductModal';
import QuickStockMobile from './QuickStockMobile';
import BarcodeScanner from './BarcodeScanner';
import NotificationSettings from './NotificationSettings';
import { generateInventoryPDF } from '../utils/pdfGenerator';
import { useToast } from './ToastNotification';

function InventoryList({ inventory, user, userRole, providers }) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    return window.innerWidth < 768 || isPWA;
  });
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
    const checkMobile = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true;
      setIsMobile(window.innerWidth < 768 || isPWA);
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const getCategoryBadge = (tipo) => {
    const categoryColors = {
      licor: { bg: 'primary', text: 'Licor' },
      vino: { bg: 'danger', text: 'Vino' },
      cerveza: { bg: 'warning', text: 'Cerveza' },
      whisky: { bg: 'dark', text: 'Whisky' },
      vodka: { bg: 'info', text: 'Vodka' },
      gin: { bg: 'success', text: 'Gin' },
      ron: { bg: 'secondary', text: 'Ron' },
      tequila: { bg: 'orange', text: 'Tequila' }
    };
    
    const category = categoryColors[tipo?.toLowerCase()] || { bg: 'secondary', text: tipo || 'N/A' };
    
    return (
      <Badge 
        bg={category.bg} 
        className={category.bg === 'warning' ? 'text-dark' : ''}
        style={category.bg === 'orange' ? { backgroundColor: '#fd7e14', color: 'white' } : {}}
      >
        {category.text}
      </Badge>
    );
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

  const generatePDF = (type) => {
    try {
      generateInventoryPDF(type, inventory, providers);
      toast.success('PDF generado correctamente');
    } catch (error) {
      toast.error('Error al generar PDF');
    }
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
    toast.success(`Producto encontrado: ${product.nombre}`);
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

      toast.success(`"${item.nombre}" eliminado correctamente`);
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar el producto');
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
      
      toast.success(`Stock de ${item.nombre} actualizado`);
    } catch (error) {
      console.error('Error actualizando stock:', error);
      toast.error('Error actualizando el stock');
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
      
      toast.success(`${item.nombre} ${!item.importante ? 'marcado' : 'desmarcado'} como importante`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar producto');
    }
  };

  return (
    <>
      {(isMobile && !forceDesktopView) ? (
        <QuickStockMobile 
          inventory={inventory}
          user={user}
          userRole={userRole}
          onToggleView={toggleView}
        />
      ) : (
        <>
          <Row className="mb-4">
            <Col>
              <h2 className="mb-3">
                🍸 Inventario del Bar
              </h2>
              <Row className="g-3">
                <Col md={3}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Total Productos</h6>
                      <h3 className="mb-0">{stats.total}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 shadow-sm border-warning">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Stock Bajo</h6>
                      <h3 className="mb-0 text-warning">{stats.lowStock}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 shadow-sm border-danger">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Sin Stock</h6>
                      <h3 className="mb-0 text-danger">{stats.outOfStock}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 shadow-sm border-primary">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Importantes</h6>
                      <h3 className="mb-0 text-primary">{stats.important}</h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              <Row className="mb-3 align-items-center">
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={8} className="text-end">
                  {(userRole === 'admin' || userRole === 'manager' || userRole === 'bartender') && (
                    <>
                      <Button 
                        variant="primary" 
                        onClick={handleAddItem}
                        className="me-2"
                      >
                        <FaPlus /> Agregar Producto
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setShowBarcodeScanner(true)}
                        className="me-2"
                      >
                        <FaBarcode /> Escanear
                      </Button>
                    </>
                  )}
                  {isMobile && (
                    <Button 
                      variant="outline-info" 
                      onClick={toggleView}
                      className="me-2"
                    >
                      <FaMobileAlt /> Vista Móvil
                    </Button>
                  )}
                  <NotificationSettings />
                  <Dropdown className="d-inline ms-2">
                    <Dropdown.Toggle variant="success" id="dropdown-pdf">
                      <FaFilePdf /> Reportes PDF
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
                    <option value="all">Todos los stocks</option>
                    <option value="good">Stock Normal</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                  </Form.Select>
                </Col>
              </Row>

              <div className="table-responsive mt-4">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}></th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th className="text-center">Stock</th>
                      <th>Proveedor</th>
                      <th className="text-center">Estado</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <p className="text-muted mb-0">
                            {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                              ? 'No se encontraron productos con los filtros aplicados'
                              : 'No hay productos en el inventario'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        const provider = providers.find(p => p.id === item.proveedor_id);
                        
                        return (
                          <tr key={item.id}>
                            <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              <Button
                                variant="link"
                                className="p-0"
                                onClick={() => handleToggleImportante(item)}
                                style={{ fontSize: '1.2rem' }}
                              >
                                {item.importante ? 
                                  <FaStar className="text-warning" /> : 
                                  <FaRegStar className="text-muted" />
                                }
                              </Button>
                            </td>
                            <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                  {item.marca ? `${item.marca} - ` : ''}{item.nombre}
                                </strong>
                              </div>
                              {item.codigo_barras && (
                                <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                                  📦 {item.codigo_barras}
                                </small>
                              )}
                            </td>
                            <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              {getCategoryBadge(item.tipo)}
                            </td>
                            <td className="text-center" style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              {(userRole === 'admin' || userRole === 'manager' || userRole === 'bartender') ? (
                                <Form.Control
                                  type="number"
                                  value={item.stock || 0}
                                  onChange={(e) => handleQuickStockUpdate(item, e.target.value)}
                                  className="stock-input"
                                  style={{ 
                                    width: '90px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    color: getStockColor(item),
                                    fontSize: '1rem',
                                    padding: '0.5rem',
                                    margin: '0 auto',
                                    display: 'inline-block',
                                    backgroundColor: 'transparent',
                                    border: '2px solid var(--border-light)',
                                    borderRadius: '8px'
                                  }}
                                  min="0"
                                  step="0.5"
                                />
                              ) : (
                                <span style={{
                                  fontWeight: 'bold',
                                  color: getStockColor(item),
                                  fontSize: '1rem'
                                }}>
                                  {item.stock || 0}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              {provider ? (
                                <span style={{ fontSize: '0.9rem' }}>{provider.empresa || provider.nombre}</span>
                              ) : (
                                <small className="text-muted">Sin proveedor</small>
                              )}
                            </td>
                            <td className="text-center" style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              {getStockBadge(item)}
                            </td>
                            <td className="text-center" style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              <ButtonGroup size="sm">
                                {(userRole === 'admin' || userRole === 'manager' || userRole === 'bartender') && (
                                  <Button 
                                    variant="outline-primary" 
                                    onClick={() => handleEditItem(item)}
                                    style={{ padding: '0.4rem 0.8rem' }}
                                  >
                                    <FaEdit />
                                  </Button>
                                )}
                                {(userRole === 'admin' || userRole === 'manager') && (
                                  <Button 
                                    variant="outline-danger"
                                    onClick={() => handleDeleteItem(item)}
                                    style={{ padding: '0.4rem 0.8rem' }}
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
              </div>
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
        userRole={userRole}
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