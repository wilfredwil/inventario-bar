// src/components/ProviderManagement.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaPhone, FaEnvelope, FaUser } from 'react-icons/fa';
import { addDoc, updateDoc, deleteDoc, doc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function ProviderManagement({ providers, user }) {

  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    empresa: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: ''
  });

  const handleAddProvider = () => {
    setEditingProvider(null);
    setFormData({
      empresa: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      notas: ''
    });
    setShowModal(true);
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setFormData({
      empresa: provider.empresa || '',
      contacto: provider.contacto || '',
      telefono: provider.telefono || '',
      email: provider.email || '',
      direccion: provider.direccion || '',
      notas: provider.notas || ''
    });
    setShowModal(true);
  };

  const handleSaveProvider = async () => {
    if (!formData.empresa.trim()) {
      setError('El nombre de la empresa es obligatorio');
      return;
    }

    try {
      const providerData = {
        ...formData,
        updated_at: serverTimestamp(),
        updated_by: user.email
      };

      if (editingProvider) {
        await updateDoc(doc(db, 'providers', editingProvider.id), providerData);
        setSuccess('Proveedor actualizado correctamente');
      } else {
        await addDoc(collection(db, 'providers'), {
          ...providerData,
          created_at: serverTimestamp(),
          created_by: user.email
        });
        setSuccess('Proveedor agregado correctamente');
      }

      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
      window.location.reload();
    } catch (error) {
      console.error('Error guardando proveedor:', error);
      setError('Error al guardar el proveedor');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteProvider = async (provider) => {
    if (!window.confirm(`¿Estás seguro de eliminar el proveedor "${provider.empresa}"?`)) return;

    try {
      await deleteDoc(doc(db, 'providers', provider.id));
      setSuccess('Proveedor eliminado correctamente');
      setTimeout(() => setSuccess(''), 3000);
      window.location.reload();
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      setError('Error al eliminar el proveedor');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏢 Gestión de Proveedores</h2>
        <Button variant="primary" onClick={handleAddProvider}>
          <FaPlus /> Agregar Proveedor
        </Button>
      </div>

      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Tarjetas de proveedores */}
      <Row>
        {providers.length === 0 ? (
          <Col>
            <Card>
              <Card.Body className="text-center py-5">
                <p className="text-muted mb-0">No hay proveedores registrados</p>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          providers.map(provider => (
            <Col md={6} lg={4} key={provider.id} className="mb-4">
              <Card className="h-100">
                <Card.Header className="bg-primary text-white">
                  <strong>{provider.empresa}</strong>
                </Card.Header>
                <Card.Body>
                  {provider.contacto && (
                    <p className="mb-2">
                      <FaUser className="me-2 text-muted" />
                      {provider.contacto}
                    </p>
                  )}
                  {provider.telefono && (
                    <p className="mb-2">
                      <FaPhone className="me-2 text-muted" />
                      <a href={`tel:${provider.telefono}`}>{provider.telefono}</a>
                    </p>
                  )}
                  {provider.email && (
                    <p className="mb-2">
                      <FaEnvelope className="me-2 text-muted" />
                      <a href={`mailto:${provider.email}`}>{provider.email}</a>
                    </p>
                  )}
                  {provider.direccion && (
                    <p className="mb-2 text-muted">
                      <small>📍 {provider.direccion}</small>
                    </p>
                  )}
                  {provider.notas && (
                    <p className="mb-0 text-muted">
                      <small>📝 {provider.notas}</small>
                    </p>
                  )}
                </Card.Body>
                <Card.Footer className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="flex-grow-1"
                    onClick={() => handleEditProvider(provider)}
                  >
                    <FaEdit /> Editar
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDeleteProvider(provider)}
                  >
                    <FaTrash />
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProvider ? '✏️ Editar Proveedor' : '➕ Agregar Proveedor'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Empresa *</Form.Label>
              <Form.Control
                type="text"
                value={formData.empresa}
                onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                placeholder="Ej: Distribuidora ABC"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Persona de Contacto</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.contacto}
                    onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                    placeholder="Ej: Juan Pérez"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="Ej: +34 123 456 789"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Ej: contacto@empresa.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                placeholder="Ej: Calle Principal 123, Ciudad"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                placeholder="Notas adicionales..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveProvider}>
            {editingProvider ? 'Actualizar' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProviderManagement;