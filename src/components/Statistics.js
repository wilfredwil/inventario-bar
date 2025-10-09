// src/components/Statistics.js
import React from 'react';
import { Row, Col, Card, Table } from 'react-bootstrap';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

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

  // Datos para gráfico de pastel (estado del stock)
  const stockPieData = [
    { name: 'Stock OK', value: goodStockItems.length, color: '#28a745' },
    { name: 'Stock Bajo', value: lowStockItems.length, color: '#ffc107' },
    { name: 'Sin Stock', value: outOfStockItems.length, color: '#dc3545' }
  ];

  // Datos para gráfico de barras (categorías)
  const categoryChartData = categoryStats.map(cat => ({
    categoria: cat.name,
    productos: cat.count,
    valor: cat.value
  }));

  // Colores personalizados
  const COLORS = ['#28a745', '#ffc107', '#dc3545', '#007bff', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];

  return (
    <div>
      <h2 className="mb-4">📊 Estadísticas del Inventario</h2>

      {/* Resumen general - Cards con animación */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-0" style={{ transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Card.Body>
              <div className="display-4 text-primary mb-2">🔢</div>
              <h4 className="text-primary mb-2">{totalProducts}</h4>
              <small className="text-muted">Total Productos</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-0" style={{ transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Card.Body>
              <div className="display-4 text-success mb-2">💰</div>
              <h4 className="text-success mb-2">${totalValue.toFixed(2)}</h4>
              <small className="text-muted">Valor Total Inventario</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-0" style={{ transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Card.Body>
              <div className="display-4 text-info mb-2">💸</div>
              <h4 className="text-info mb-2">${totalCost.toFixed(2)}</h4>
              <small className="text-muted">Costo Total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-0" style={{ transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Card.Body>
              <div className="display-4 text-warning mb-2">📈</div>
              <h4 className="text-warning mb-2">${potentialProfit.toFixed(2)}</h4>
              <small className="text-muted">Ganancia Potencial</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráficos visuales */}
      <Row className="mb-4">
        {/* Gráfico de pastel - Estado del Stock */}
        <Col lg={6} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>📊 Distribución del Stock</strong>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <div className="d-flex justify-content-around">
                  <div>
                    <div className="badge bg-success mb-1">✓ Stock OK</div>
                    <div><strong>{goodStockItems.length}</strong> productos</div>
                  </div>
                  <div>
                    <div className="badge bg-warning text-dark mb-1">⚡ Stock Bajo</div>
                    <div><strong>{lowStockItems.length}</strong> productos</div>
                  </div>
                  <div>
                    <div className="badge bg-danger mb-1">⚠ Sin Stock</div>
                    <div><strong>{outOfStockItems.length}</strong> productos</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Resumen de Alertas con iconos grandes */}
        <Col lg={6} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>🔔 Resumen de Alertas</strong>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ backgroundColor: '#fee' }}>
                <div>
                  <h3 className="mb-0 text-danger">{outOfStockItems.length}</h3>
                  <small className="text-muted">Productos sin stock</small>
                </div>
                <div className="text-danger" style={{ fontSize: '3rem' }}>⚠️</div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ backgroundColor: '#fff8e1' }}>
                <div>
                  <h3 className="mb-0 text-warning">{lowStockItems.length}</h3>
                  <small className="text-muted">Productos con stock bajo</small>
                </div>
                <div className="text-warning" style={{ fontSize: '3rem' }}>⚡</div>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: '#e3f2fd' }}>
                <div>
                  <h3 className="mb-0 text-info">{importantItems.length}</h3>
                  <small className="text-muted">Productos importantes</small>
                </div>
                <div className="text-info" style={{ fontSize: '3rem' }}>⭐</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráfico de barras - Productos por categoría */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>📦 Productos por Categoría</strong>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={categoryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip formatter={(value) => typeof value === 'number' && value > 100 ? `$${value.toFixed(2)}` : value} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="productos" fill="#007bff" name="Cantidad de Productos" />
                  <Bar yAxisId="right" dataKey="valor" fill="#28a745" name="Valor Total ($)" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráfico de área - Top 10 productos más valiosos */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>💎 Top 10 Productos Más Valiosos</strong>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart 
                  data={topValueProducts.map(item => ({
                    nombre: item.nombre.length > 20 ? item.nombre.substring(0, 20) + '...' : item.nombre,
                    valor: (item.precio_venta || 0) * (item.stock || 0),
                    stock: item.stock
                  }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [name === 'valor' ? `$${value.toFixed(2)}` : value, name === 'valor' ? 'Valor Total' : 'Stock']} />
                  <Legend />
                  <Area type="monotone" dataKey="valor" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Valor Total ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabla de productos críticos */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>🚨 Productos Críticos (Necesitan Reposición Urgente)</strong>
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

      {/* Tabla detallada por categoría */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>📋 Estadísticas Detalladas por Categoría</strong>
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
    </div>
  );
}

export default Statistics;