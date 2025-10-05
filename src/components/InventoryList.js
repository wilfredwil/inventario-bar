// src/components/InventoryList.js - OPTIMIZADO
import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, InputGroup, Alert, Dropdown, ButtonGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaStar, FaRegStar, FaSearch, FaFilePdf } from 'react-icons/fa';
import { updateDoc, deleteDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ProductModal from './ProductModal';
import QuickStockMobile from './QuickStockMobile';
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

  // Detectar cambios de tamaño de pantalla
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función auxiliar para verificar stock - ELIMINADO DUPLICACIÓN
  const checkStockLevel = useCallback((item, level) => {
    const umbral = item.umbral_low || 5;
    switch (level) {
      case 'low':
        return item.stock <= umbral && item.stock > 0;
      case 'out':
        return item.stock === 0;
      case 'good':
        return item.stock > umbral;
      default:
        return true;
    }
  }, []);

  // Filtrar inventario - OPTIMIZADO CON USEMEMO
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.marca?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.tipo === categoryFilter;
      const matchesStock = stockFilter === 'all' || checkStockLevel(item, stockFilter);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [inventory, searchTerm, categoryFilter, stockFilter, checkStockLevel]);

  // Estadísticas rápidas - OPTIMIZADO CON USEMEMO
  const stats = useMemo(() => ({
    total: inventory.length,
    lowStock: inventory.filter(i => checkStockLevel(i, 'low')).length,
    outOfStock: inventory.filter(i => checkStockLevel(i, 'out')).length,
    important: inventory.filter(i => i.importante).length
  }), [inventory, checkStockLevel]);

  // Funciones de manejo - OPTIMIZADO CON USECALLBACK
  const handleAddItem = useCallback(() => {
    setEditingItem(null);
    setShowModal(true);
  }, []);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setShowModal(true);
  }, []);

  const handleDeleteItem = useCallback(async (item) => {
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
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setError(`Error al eliminar el producto: ${err.message}`);
      setTimeout(() => setError(''), 3000);
    }
  }, [user.email]);

  const handleQuickStockUpdate = useCallback(async (item, newStock) => {
    try {
      const stockValue = parseFloat(newStock);
      if (isNaN(stockValue) || stockValue < 0) {
        setError('El stock debe ser un número válido mayor o igual a 0');
        setTimeout(() => setError(''), 3000);
        return;
      }

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
      
      setSuccess(`Stock de ${item.nombre} actualizado correctamente`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error actualizando stock:', err);
      setError(`Error actualizando el stock: ${err.message}`);
      setTimeout(() => setError(''), 3000);
    }
  }, [user.email]);

  const handleToggleImportante = useCallback(async (item) => {
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
    } catch (err) {
      console.error('Error:', err);
      setError(`Error al marcar como importante: ${err.message}`);
      setTimeout(() => setError(''), 3000);
    }
  }, [user.email]);

  const generatePDF = useCallback((type) => {
    try {
      generateInventoryPDF(type, inventory, providers);
    } catch (err) {
      console.error('Error generando PDF:', err);
      setError('Error al generar el PDF. Por favor, intenta de nuevo.');
      setTimeout(() => setError(''), 3000);
    }
  }, [inventory, providers]);

  const getStockBadge = useCallback((item) => {
    if (item.stock === 0) return <Badge bg="danger">Sin Stock</Badge>;
    if (checkStockLevel(item, 'low')) return <Badge bg="warning" text="dark">Stock Bajo</Badge>;
    return <Badge bg="success">OK</Badge>;
  }, [checkStockLevel]);

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
                      placeholder="Buscar producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3} className="mb-3 mb-md-0">
                  <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2} className="mb-3 mb-md-0">
                  <Form.Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="good">Stock OK</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="d-flex gap-2">
                  <Button variant="primary" onClick={handleAddItem} className="flex-grow-1">
                    <FaPlus /> Agregar
                  </Button>
                  <Dropdown as={ButtonGroup} drop="up" className="pdf-dropdown">
                    <Button variant="secondary">
                      <FaFilePdf /> PDF
                    </Button>
                    <Dropdown.Toggle split variant="secondary" />
                    <Dropdown.Menu style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Dropdown.Header>Reportes Generales</Dropdown.Header>
                      <Dropdown.Item onClick={() => generatePDF('complete')}>
                        📋 Inventario Completo
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('low-stock')}>
                        ⚠️ Stock Bajo
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('out-of-stock')}>
                        ❌ Sin Stock
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('critical')}>
                        🚨 Stock Crítico
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Header>Reportes Especiales</Dropdown.Header>
                      <Dropdown.Item onClick={() => generatePDF('by-category')}>
                        📊 Por Categorías
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('by-provider')}>
                        🏢 Reposición por Proveedor
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => generatePDF('valuation')}>
                        💰 Valoración Financiera
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabla de inventario */}
          <Card>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th className="text-center">Stock</th>
                      <th className="text-center">Estado</th>
                      <th className="text-end">Precio</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          No hay productos que mostrar
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map(item => (
                        <tr key={item.id} style={{ backgroundColor: item.importante ? '#fff3cd' : 'transparent' }}>
                          <td className="text-center">
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0"
                              onClick={() => handleToggleImportante(item)}
                              title={item.importante ? 'Desmarcar como importante' : 'Marcar como importante'}
                            >
                              {item.importante ? <FaStar style={{ color: '#ffc107' }} /> : <FaRegStar style={{ color: '#6c757d' }} />}
                            </Button>
                          </td>
                          <td>
                            <strong>{item.nombre}</strong>
                            {item.marca && <div className="text-muted small">{item.marca}</div>}
                          </td>
                          <td className="text-center">
                            <Badge bg="secondary">{item.tipo}</Badge>
                          </td>
                          <td className="text-center">
                            <strong>{item.stock || 0}</strong> {item.unidad_medida}
                          </td>
                          <td className="text-center">
                            {getStockBadge(item)}
                          </td>
                          <td className="text-end">
                            ${(item.precio_venta || 0).toFixed(2)}
                          </td>
                          <td className="text-center">
                            <ButtonGroup size="sm">
                              <Button variant="outline-primary" onClick={() => handleEditItem(item)} title="Editar">
                                <FaEdit />
                              </Button>
                              {(userRole === 'admin' || userRole === 'manager') && (
                                <Button variant="outline-danger" onClick={() => handleDeleteItem(item)} title="Eliminar">
                                  <FaTrash />
                                </Button>
                              )}
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          <ProductModal
            show={showModal}
            onHide={() => setShowModal(false)}
            editingItem={editingItem}
            user={user}
            providers={providers}
            categories={categories}
          />
        </>
      )}
    </>
  );
}

export default InventoryList;