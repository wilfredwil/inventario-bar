// src/components/UserManagement.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaUserTie, FaUser, FaEye } from 'react-icons/fa';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';

function UserManagement({ user, userRole }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'bartender',
    active: true,
    password: ''
  });

  const roles = [
    { 
      value: 'admin', 
      label: 'Administrador', 
      icon: FaUserShield, 
      color: 'danger', 
      description: 'Control total del sistema' 
    },
    { 
      value: 'manager', 
      label: 'Manager', 
      icon: FaUserTie, 
      color: 'primary', 
      description: 'Gestión completa excepto usuarios' 
    },
    { 
      value: 'bartender', 
      label: 'Bartender', 
      icon: FaUser, 
      color: 'success', 
      description: 'Puede editar stock y productos' 
    },
    { 
      value: 'guest', 
      label: 'Mesero/Guest', 
      icon: FaEye, 
      color: 'info', 
      description: 'Solo lectura, no puede editar' 
    }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('email'));
      const snapshot = await getDocs(q);
      
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      name: '',
      role: 'guest',
      active: true,
      password: ''
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      name: user.name || '',
      role: user.role || 'guest',
      active: user.active !== false,
      password: ''
    });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.email.trim() || !formData.name.trim()) {
      setError('Email y nombre son obligatorios');
      return;
    }

    if (!editingUser && !formData.password) {
      setError('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    try {
      const userData = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        active: formData.active,
        updated_at: new Date()
      };

      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), userData);
        setSuccess('Usuario actualizado correctamente');
      } else {
        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );

        // Guardar en Firestore
        await addDoc(collection(db, 'users'), {
          ...userData,
          uid: userCredential.user.uid,
          created_at: new Date()
        });

        setSuccess('Usuario creado correctamente');
      }

      setShowModal(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error guardando usuario:', error);
      setError(error.message || 'Error al guardar el usuario');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.email === user.email) {
      setError('No puedes eliminar tu propio usuario');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el usuario "${userToDelete.email}"?`)) return;

    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      setSuccess('Usuario eliminado correctamente');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      setError('Error al eliminar el usuario');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getRoleBadge = (role) => {
    const roleInfo = roles.find(r => r.value === role) || roles[3];
    const Icon = roleInfo.icon;
    
    return (
      <Badge bg={roleInfo.color}>
        <Icon className="me-1" />
        {roleInfo.label}
      </Badge>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>👥 Gestión de Usuarios</h2>
        <Button variant="primary" onClick={handleAddUser}>
          <FaPlus /> Agregar Usuario
        </Button>
      </div>

      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <p className="text-muted">Cargando usuarios...</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td className="text-center">
                        {u.active !== false ? (
                          <Badge bg="success">Activo</Badge>
                        ) : (
                          <Badge bg="secondary">Inactivo</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditUser(u)}
                        >
                          <FaEdit /> Editar
                        </Button>
                        {u.email !== user.email && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteUser(u)}
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? '✏️ Editar Usuario' : '➕ Agregar Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre Completo *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Juan Pérez"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="usuario@ejemplo.com"
                disabled={editingUser !== null}
                required
              />
              {editingUser && (
                <Form.Text className="text-muted">
                  El email no se puede modificar
                </Form.Text>
              )}
            </Form.Group>

            {!editingUser && (
              <Form.Group className="mb-3">
                <Form.Label>Contraseña *</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Rol *</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                <div className="mt-2">
                  <strong>Permisos por rol:</strong>
                  <ul className="mb-0 mt-1" style={{ fontSize: '0.9em' }}>
                    <li><strong>Admin:</strong> Control total (usuarios, proveedores, inventario)</li>
                    <li><strong>Manager:</strong> Puede editar/eliminar productos y proveedores</li>
                    <li><strong>Bartender:</strong> Puede actualizar stock y editar productos</li>
                    <li><strong>Mesero/Guest:</strong> Solo puede ver cantidades (sin editar)</li>
                  </ul>
                </div>
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Usuario activo"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            {editingUser ? 'Actualizar' : 'Crear Usuario'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UserManagement;