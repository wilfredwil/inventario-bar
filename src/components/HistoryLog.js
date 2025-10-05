// src/components/HistoryLog.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Form, Row, Col, Spinner } from 'react-bootstrap';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function HistoryLog({ user, userRole }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [limitRecords, setLimitRecords] = useState(50);

  useEffect(() => {
    loadHistory();
  }, [limitRecords]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyRef = collection(db, 'historial');
      let q = query(
        historyRef,
        where('tipo_inventario', '==', 'bar'),
        orderBy('fecha', 'desc'),
        limit(limitRecords)
      );

      const snapshot = await getDocs(q);
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate()
      }));

      setHistory(historyData);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      'creacion': { variant: 'success', label: 'Creación', icon: '➕' },
      'edicion': { variant: 'primary', label: 'Edición', icon: '✏️' },
      'actualizacion_stock': { variant: 'info', label: 'Stock', icon: '📦' },
      'eliminacion': { variant: 'danger', label: 'Eliminación', icon: '🗑️' },
      'marca_importante': { variant: 'warning', label: 'Importante', icon: '⭐' }
    };

    const typeInfo = types[type] || { variant: 'secondary', label: type, icon: '📝' };
    
    return (
      <Badge bg={typeInfo.variant}>
        {typeInfo.icon} {typeInfo.label}
      </Badge>
    );
  };

  const filteredHistory = history.filter(item => {
    const matchesType = filterType === 'all' || item.tipo === filterType;
    const matchesUser = filterUser === 'all' || item.usuario === filterUser;
    return matchesType && matchesUser;
  });

  const uniqueUsers = [...new Set(history.map(item => item.usuario))];

  return (
    <div>
      <h2 className="mb-4">📜 Historial de Cambios</h2>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3 mb-md-0">
              <Form.Label>Tipo de Acción</Form.Label>
              <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Todas las acciones</option>
                <option value="creacion">Creación</option>
                <option value="edicion">Edición</option>
                <option value="actualizacion_stock">Actualización de Stock</option>
                <option value="eliminacion">Eliminación</option>
                <option value="marca_importante">Marca Importante</option>
              </Form.Select>
            </Col>
            <Col md={4} className="mb-3 mb-md-0">
              <Form.Label>Usuario</Form.Label>
              <Form.Select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                <option value="all">Todos los usuarios</option>
                {uniqueUsers.map(usuario => (
                  <option key={usuario} value={usuario}>{usuario}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Cantidad de Registros</Form.Label>
              <Form.Select value={limitRecords} onChange={(e) => setLimitRecords(Number(e.target.value))}>
                <option value="25">25 registros</option>
                <option value="50">50 registros</option>
                <option value="100">100 registros</option>
                <option value="200">200 registros</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de historial */}
      <Card>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando historial...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '180px' }}>Fecha y Hora</th>
                    <th>Producto</th>
                    <th>Acción</th>
                    <th>Usuario</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        No hay registros en el historial
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(item => (
                      <tr key={item.id}>
                        <td>
                          <small>
                            {item.fecha ? (
                              <>
                                {item.fecha.toLocaleDateString('es-ES')}<br />
                                {item.fecha.toLocaleTimeString('es-ES')}
                              </>
                            ) : (
                              'Fecha no disponible'
                            )}
                          </small>
                        </td>
                        <td>
                          <strong>{item.item_nombre}</strong>
                        </td>
                        <td>
                          {getTypeBadge(item.tipo)}
                        </td>
                        <td>
                          <small className="text-muted">{item.usuario}</small>
                        </td>
                        <td>
                          <small>{item.detalles}</small>
                          {item.stock_anterior !== undefined && item.stock_nuevo !== undefined && (
                            <div className="mt-1">
                              <Badge bg="light" text="dark" className="me-1">
                                Anterior: {item.stock_anterior}
                              </Badge>
                              <Badge bg="light" text="dark">
                                Nuevo: {item.stock_nuevo}
                              </Badge>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        <Card.Footer className="text-muted text-center">
          <small>Mostrando {filteredHistory.length} de {history.length} registros</small>
        </Card.Footer>
      </Card>
    </div>
  );
}

export default HistoryLog;