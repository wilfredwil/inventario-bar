// src/components/ProductModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { addDoc, updateDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function ProductModal({ show, onHide, editingItem, user, providers, categories }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'licor',
    stock: 0,
    precio_venta: 0,
    precio_compra: 0,
    unidad_medida: 'botella',
    umbral_low: 5,
    proveedor_id: '',
    notas: '',
    importante: false
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        nombre: editingItem.nombre || '',
        tipo: editingItem.tipo || 'licor',
        stock: editingItem.stock || 0,
        precio_venta: editingItem.precio_venta || 0,
        precio_compra: editingItem.precio_compra || 0,
        unidad_medida: editingItem.unidad_medida || 'botella',
        umbral_low: editingItem.umbral_low || 5,
        proveedor_id: editingItem.proveedor_id || '',
        notas: editingItem.notas || '',
        importante: editingItem.importante || false
      });
    } else {
      setFormData({
        nombre: '',
        tipo: 'licor',
        stock: 0,
        precio_venta: 0,
        precio_compra: 0,
        unidad_medida: 'botella',
        umbral_low: 5,
        proveedor_id: '',
        notas: '',
        importante: false
      });
    }
    setError('');
  }, [editingItem, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const itemData = {
        ...formData,
        tipo_inventario: 'bar',
        stock: parseFloat(formData.stock) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        umbral_low: parseFloat(formData.umbral_low) || 5,
        updated_at: serverTimestamp(),
        updated_by: user.email
      };

      if (editingItem) {
        await updateDoc(doc(db, 'inventario', editingItem.id), itemData);
        
        await addDoc(collection(db, 'historial'), {
          item_nombre: formData.nombre,
          usuario: user.email,
          tipo: 'edicion',
          fecha: serverTimestamp(),
          detalles: `Producto editado`,
          tipo_inventario: 'bar'
        });
      } else {
        await addDoc(collection(db, 'inventario'), {
          ...itemData,
          created_at: serverTimestamp(),
          created_by: user.email
        });

        await addDoc(collection(db, 'historial'), {
          item_nombre: formData.nombre,
          usuario: user.email,
          tipo: 'creacion',
          fecha: serverTimestamp(),
          detalles: `Producto creado`,
          tipo_inventario: 'bar'
        });
      }

      onHide();
    } catch (error) {
      console.error('Error guardando producto:', error);
      setError('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {editingItem ? '✏️ Editar Producto' : '➕ Agregar Producto'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Producto *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Whisky Jack Daniel's"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría *</Form.Label>
                <Form.Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  required
                >
                  {categories.filter(c => c.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Stock Actual *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Unidad de Medida *</Form.Label>
                <Form.Select
                  value={formData.unidad_medida}
                  onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                  required
                >
                  <option value="botella">Botella</option>
                  <option value="litro">Litro</option>
                  <option value="ml">Mililitro</option>
                  <option value="unidad">Unidad</option>
                  <option value="caja">Caja</option>
                  <option value="kg">Kilogramo</option>
                  <option value="gr">Gramo</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Stock Mínimo *</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.umbral_low}
                  onChange={(e) => setFormData({...formData, umbral_low: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Precio de Venta *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={formData.precio_venta}
                  onChange={(e) => setFormData({...formData, precio_venta: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Precio de Compra</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={formData.precio_compra}
                  onChange={(e) => setFormData({...formData, precio_compra: e.target.value})}
                  placeholder="0.00"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Proveedor</Form.Label>
            <Form.Select
              value={formData.proveedor_id}
              onChange={(e) => setFormData({...formData, proveedor_id: e.target.value})}
            >
              <option value="">Seleccionar proveedor...</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.empresa}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Notas</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.notas}
              onChange={(e) => setFormData({...formData, notas: e.target.value})}
              placeholder="Notas adicionales..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Marcar como producto importante"
              checked={formData.importante}
              onChange={(e) => setFormData({...formData, importante: e.target.checked})}
            />
          </Form.Group>

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : editingItem ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default ProductModal;