// src/components/Statistics.js
import React from 'react';
import { Row, Col, Card, Table, ProgressBar } from 'react-bootstrap';

function Statistics({ inventory }) {
  // Cálculos básicos
  const totalProducts = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + ((item.precio_venta || 0) * (item.stock || 0)), 0);
  const totalCost = inventory.reduce((sum, item) => sum + ((item.precio_compra || 0) * (item.stock || 0)), 0);
  const potentialProfit = totalValue - totalCost;
  
  const lowStockItems = inventory.filter(item => item.stock <= (item.umbral_low || 5) && item.stock > 0);
  const outOfStockItems = inventory.filter(item => item.stock === 0);
  const goodStockItems = inventory.filter(item => item.stock > (item.umbral_low || 5));
  const importantItems = inventory.filter(item => item.importante);

  // Estadísticas por categoría
  const categories = ['licor', 'vino', 'cerveza', 'whisky', 'vodka', 'gin', 'ron', 'tequila'];
  const categoryStats = categories.map(cat => {
    const items = inventory.filter(item => item.tipo === cat);
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: items.length,
      value: items.reduce((sum, item) => sum + ((item.precio_venta || 0) * (item.stock || 0)), 0),
      lowStock: items.filter(item => item.stock <= (item.umbral_low || 5) && item.stock > 0).length,
      outOfStock: items.filter(item => item.stock === 0).length
    };
  }).filter(cat => cat.count > 0).sort((a, b) => b.count - a.count);

  // Top 10 productos más valiosos
  const topValueProducts = [...inventory]
    .sort((a, b) => ((b.precio_venta || 0) * (b.stock || 0)) - ((a.precio_venta || 0) * (a.stock || 0)))
    .slice(0, 10);

  // Productos que necesitan reposición urgente
  const criticalProducts = inventory
    .filter(item => item.stock === 0 || (item.stock <= (item.umbral_low || 5) && item.importante))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  const getStockPercentage = () => {
    if (totalProducts === 0) return { good: 0, low: 0, out: 100 };
    return {
      good: (goodStockItems.length / totalProducts) * 100,
      low: (lowStockItems.length / totalProducts) * 100,
      out: (outOfStockItems.length / totalProducts) * 100
    };
  };

  const stockPercentages = getStockPercentage();

  return (
    <div>
      <h2 className="mb-4">📊 Estadísticas del Inventario</h2>

      {/* Resumen general */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-primary mb-2">{totalProducts}</h4>
              <small className="text-muted">Total Productos</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-success mb-2">${totalValue.toFixed(2)}</h4>
              <small className="text-muted">Valor Total Inventario</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-info mb-2">${totalCost.toFixed(2)}</h4>
              <small className="text-muted">Costo Total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-warning mb-2">${potentialProfit.toFixed(2)}</h4>
              <small className="text-muted">Ganancia Potencial</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estado del stock */}
      <Row className="mb-4">
        <Col lg={6} className="mb-3">
          <Card>
            <Card.Header>
              <strong>Estado General del Stock</strong>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Stock OK ({goodStockItems.length})</span>
                  <span>{stockPercentages.good.toFixed(1)}%</span>
                </div>
                <ProgressBar variant="success" now={stockPercentages.good} />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Stock Bajo ({lowStockItems.length})</span>
                  <span>{stockPercentages.low.toFixed(1)}%</span>
                </div>
                <ProgressBar variant="warning" now={stockPercentages.low} />
              </div>
              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Sin Stock ({outOfStockItems.length})</span>
                  <span>{stockPercentages.out.toFixed(1)}%</span>
                </div>
                <ProgressBar variant="danger" now={stockPercentages.out} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-3">
          <Card>
            <Card.Header>
              <strong>Resumen de Alertas</strong>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                <div>
                  <h5 className="mb-0 text-danger">{outOfStockItems.length}</h5>
                  <small className="text-muted">Productos sin stock</small>
                </div>
                <div className="text-danger display-6">⚠️</div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                <div>
                  <h5 className="mb-0 text-warning">{lowStockItems.length}</h5>
                  <small className="text-muted">Productos con stock bajo</small>
                </div>
                <div className="text-warning display-6">⚡</div>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                <div>
                  <h5 className="mb-0 text-info">{importantItems.length}</h5>
                  <small className="text-muted">Productos importantes</small>
                </div>
                <div className="text-info display-6">⭐</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estadísticas por categoría */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card>
            <Card.Header>
              <strong>Estadísticas por Categoría</strong>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Categoría</th>
                    <th className="text-center">Productos</th>
                    <th className="text-end">Valor Total</th>
                    <th className="text-center">Stock Bajo</th>
                    <th className="text-center">Sin Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats.map(cat => (
                    <tr key={cat.name}>
                      <td><strong>{cat.name}</strong></td>
                      <td className="text-center">{cat.count}</td>
                      <td className="text-end">${cat.value.toFixed(2)}</td>
                      <td className="text-center">
                        {cat.lowStock > 0 ? (
                          <span className="badge bg-warning text-dark">{cat.lowStock}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        {cat.outOfStock > 0 ? (
                          <span className="badge bg-danger">{cat.outOfStock}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top productos */}
      <Row>
        <Col lg={6} className="mb-3">
          <Card>
            <Card.Header>
              <strong>Top 10 Productos Más Valiosos</strong>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th className="text-center">Stock</th>
                    <th className="text-end">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {topValueProducts.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.nombre}</td>
                      <td className="text-center">{item.stock}</td>
                      <td className="text-end">
                        <strong>${((item.precio_venta || 0) * (item.stock || 0)).toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-3">
          <Card>
            <Card.Header>
              <strong>Productos que Necesitan Reposición Urgente</strong>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Stock</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalProducts.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">
                        ✅ No hay productos críticos
                      </td>
                    </tr>
                  ) : (
                    criticalProducts.map(item => (
                      <tr key={item.id}>
                        <td>
                          {item.importante && <span className="text-warning me-2">⭐</span>}
                          {item.nombre}
                        </td>
                        <td className="text-center">
                          <strong className={item.stock === 0 ? 'text-danger' : 'text-warning'}>
                            {item.stock}
                          </strong>
                        </td>
                        <td className="text-center">
                          {item.stock === 0 ? (
                            <span className="badge bg-danger">Sin Stock</span>
                          ) : (
                            <span className="badge bg-warning text-dark">Crítico</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Statistics;