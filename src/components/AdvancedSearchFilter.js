// src/components/AdvancedSearchFilter.js
import React, { useState } from 'react';
import { Card, Row, Col, Form, Button, Badge, Collapse, InputGroup } from 'react-bootstrap';
import { FaSearch, FaFilter, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

function AdvancedSearchFilter({ onFilterChange, stats, providers }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: 'all',
    stockStatus: 'all',
    provider: 'all',
    important: 'all',
    priceRange: { min: '', max: '' },
    stockRange: { min: '', max: '' }
  });

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

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRangeChange = (rangeType, field, value) => {
    const newFilters = {
      ...filters,
      [rangeType]: { ...filters[rangeType], [field]: value }
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      searchTerm: '',
      category: 'all',
      stockStatus: 'all',
      provider: 'all',
      important: 'all',
      priceRange: { min: '', max: '' },
      stockRange: { min: '', max: '' }
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.category !== 'all') count++;
    if (filters.stockStatus !== 'all') count++;
    if (filters.provider !== 'all') count++;
    if (filters.important !== 'all') count++;
    if (filters.priceRange.min || filters.priceRange.max) count++;
    if (filters.stockRange.min || filters.stockRange.max) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-3 shadow-sm border-0">
      <Card.Body>
        {/* Búsqueda básica siempre visible */}
        <Row className="align-items-center mb-3">
          <Col lg={6} className="mb-2 mb-lg-0">
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar por nombre, marca, código de barras, SKU..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                style={{ fontSize: '0.95rem' }}
              />
              {filters.searchTerm && (
                <Button 
                  variant="outline-secondary"
                  onClick={() => handleFilterChange('searchTerm', '')}
                  title="Limpiar búsqueda"
                >
                  <FaTimes />
                </Button>
              )}
            </InputGroup>
          </Col>

          <Col lg={6} className="text-lg-end">
            <Button
              variant={showAdvanced ? "primary" : "outline-primary"}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="me-2"
            >
              <FaFilter className="me-2" />
              Filtros Avanzados
              {showAdvanced ? <FaChevronUp className="ms-2" /> : <FaChevronDown className="ms-2" />}
              {activeFiltersCount > 0 && (
                <Badge bg="danger" pill className="ms-2">{activeFiltersCount}</Badge>
              )}
            </Button>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="outline-danger"
                onClick={clearAllFilters}
                title="Limpiar todos los filtros"
              >
                <FaTimes className="me-1" />
                Limpiar Filtros
              </Button>
            )}
          </Col>
        </Row>

        {/* Filtros rápidos (chips) */}
        {activeFiltersCount > 0 && (
          <div className="mb-3 d-flex flex-wrap gap-2">
            {filters.category !== 'all' && (
              <Badge 
                bg="primary" 
                className="d-flex align-items-center gap-1 py-2 px-3"
                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => handleFilterChange('category', 'all')}
              >
                Categoría: {categories.find(c => c.value === filters.category)?.label}
                <FaTimes size={12} />
              </Badge>
            )}
            {filters.stockStatus !== 'all' && (
              <Badge 
                bg="warning" 
                text="dark"
                className="d-flex align-items-center gap-1 py-2 px-3"
                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => handleFilterChange('stockStatus', 'all')}
              >
                Stock: {
                  filters.stockStatus === 'good' ? 'Normal' :
                  filters.stockStatus === 'low' ? 'Bajo' :
                  'Sin Stock'
                }
                <FaTimes size={12} />
              </Badge>
            )}
            {filters.provider !== 'all' && (
              <Badge 
                bg="info" 
                className="d-flex align-items-center gap-1 py-2 px-3"
                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => handleFilterChange('provider', 'all')}
              >
                Proveedor: {providers.find(p => p.id === filters.provider)?.nombre || 'Seleccionado'}
                <FaTimes size={12} />
              </Badge>
            )}
            {filters.important !== 'all' && (
              <Badge 
                bg="warning"
                className="d-flex align-items-center gap-1 py-2 px-3"
                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => handleFilterChange('important', 'all')}
              >
                Importantes: {filters.important === 'yes' ? 'Sí' : 'No'}
                <FaTimes size={12} />
              </Badge>
            )}
            {(filters.priceRange.min || filters.priceRange.max) && (
              <Badge 
                bg="success"
                className="d-flex align-items-center gap-1 py-2 px-3"
                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => handleRangeChange('priceRange', 'min', '').then(() => handleRangeChange('priceRange', 'max', ''))}
              >
                Precio: ${filters.priceRange.min || '0'} - ${filters.priceRange.max || '∞'}
                <FaTimes size={12} />
              </Badge>
            )}
            {(filters.stockRange.min || filters.stockRange.max) && (
              <Badge 
                bg="secondary"
                className="d-flex align-items-center gap-1 py-2 px-3"
                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => handleRangeChange('stockRange', 'min', '').then(() => handleRangeChange('stockRange', 'max', ''))}
              >
                Cantidad: {filters.stockRange.min || '0'} - {filters.stockRange.max || '∞'}
                <FaTimes size={12} />
              </Badge>
            )}
          </div>
        )}

        {/* Filtros avanzados (colapsables) */}
        <Collapse in={showAdvanced}>
          <div>
            <hr className="my-3" />
            <Row>
              {/* Categoría */}
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">
                    <FaFilter className="me-1" /> Categoría
                  </Form.Label>
                  <Form.Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    size="sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Estado de Stock */}
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">
                    📦 Estado de Stock
                  </Form.Label>
                  <Form.Select
                    value={filters.stockStatus}
                    onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                    size="sm"
                  >
                    <option value="all">Todos los niveles</option>
                    <option value="good">Stock Normal</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Proveedor */}
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">
                    🏢 Proveedor
                  </Form.Label>
                  <Form.Select
                    value={filters.provider}
                    onChange={(e) => handleFilterChange('provider', e.target.value)}
                    size="sm"
                  >
                    <option value="all">Todos los proveedores</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Productos Importantes */}
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">
                    ⭐ Productos Importantes
                  </Form.Label>
                  <Form.Select
                    value={filters.important}
                    onChange={(e) => handleFilterChange('important', e.target.value)}
                    size="sm"
                  >
                    <option value="all">Todos</option>
                    <option value="yes">Solo importantes</option>
                    <option value="no">No importantes</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Rango de Precio */}
              <Col md={4} className="mb-3">
                <Form.Label className="fw-bold text-muted small">
                  💰 Rango de Precio
                </Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder="Mín"
                    value={filters.priceRange.min}
                    onChange={(e) => handleRangeChange('priceRange', 'min', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <InputGroup.Text>-</InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder="Máx"
                    value={filters.priceRange.max}
                    onChange={(e) => handleRangeChange('priceRange', 'max', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </InputGroup>
              </Col>

              {/* Rango de Stock */}
              <Col md={4} className="mb-3">
                <Form.Label className="fw-bold text-muted small">
                  📊 Rango de Cantidad
                </Form.Label>
                <InputGroup size="sm">
                  <Form.Control
                    type="number"
                    placeholder="Mín"
                    value={filters.stockRange.min}
                    onChange={(e) => handleRangeChange('stockRange', 'min', e.target.value)}
                    min="0"
                  />
                  <InputGroup.Text>-</InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder="Máx"
                    value={filters.stockRange.max}
                    onChange={(e) => handleRangeChange('stockRange', 'max', e.target.value)}
                    min="0"
                  />
                </InputGroup>
              </Col>
            </Row>
          </div>
        </Collapse>

        {/* Estadísticas rápidas */}
        {stats && (
          <Row className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
            <Col xs={6} md={3} className="text-center mb-2">
              <div className="fw-bold text-primary" style={{ fontSize: '1.5rem' }}>
                {stats.total}
              </div>
              <small className="text-muted">Total Productos</small>
            </Col>
            <Col xs={6} md={3} className="text-center mb-2">
              <div className="fw-bold text-warning" style={{ fontSize: '1.5rem' }}>
                {stats.lowStock}
              </div>
              <small className="text-muted">Stock Bajo</small>
            </Col>
            <Col xs={6} md={3} className="text-center mb-2">
              <div className="fw-bold text-danger" style={{ fontSize: '1.5rem' }}>
                {stats.outOfStock}
              </div>
              <small className="text-muted">Sin Stock</small>
            </Col>
            <Col xs={6} md={3} className="text-center mb-2">
              <div className="fw-bold text-info" style={{ fontSize: '1.5rem' }}>
                {stats.important}
              </div>
              <small className="text-muted">Importantes</small>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}

export default AdvancedSearchFilter;