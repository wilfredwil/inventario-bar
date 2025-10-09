// src/components/NotificationSettings.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { FaBell, FaBellSlash, FaCheck, FaTimes } from 'react-icons/fa';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  sendLocalNotification
} from '../utils/notificationUtils';

function NotificationSettings() {
  const [permission, setPermission] = useState('default');
  const [supported, setSupported] = useState(true);
  const [settings, setSettings] = useState({
    outOfStock: true,
    lowStock: true,
    productUpdates: false,
    checkInterval: 60 // minutos
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
    
    // Cargar configuración guardada
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        setMessage({ type: 'success', text: '✅ Notificaciones activadas correctamente' });
        
        // Enviar notificación de prueba
        await sendLocalNotification(
          '🎉 Notificaciones activadas',
          {
            body: 'Recibirás alertas importantes sobre tu inventario',
            tag: 'welcome-notification'
          }
        );
      } else {
        setMessage({ type: 'danger', text: '❌ Permisos de notificación denegados' });
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      setMessage({ type: 'danger', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      setMessage({ type: 'warning', text: 'Primero debes activar las notificaciones' });
      return;
    }

    await sendLocalNotification(
      '🧪 Notificación de prueba',
      {
        body: 'Esta es una notificación de prueba del sistema de inventario',
        tag: 'test-notification'
      }
    );

    setMessage({ type: 'info', text: '📬 Notificación de prueba enviada' });
  };

  if (!supported) {
    return (
      <Card>
        <Card.Body>
          <Alert variant="warning">
            <FaBellSlash className="me-2" />
            Las notificaciones no están soportadas en este navegador
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex align-items-center justify-content-between">
        <h5 className="mb-0">
          <FaBell className="me-2" />
          Notificaciones Push
        </h5>
        <Badge bg={permission === 'granted' ? 'success' : permission === 'denied' ? 'danger' : 'secondary'}>
          {permission === 'granted' ? 'Activadas' : permission === 'denied' ? 'Bloqueadas' : 'Desactivadas'}
        </Badge>
      </Card.Header>

      <Card.Body>
        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {permission === 'default' && (
          <div className="mb-4">
            <Alert variant="info">
              <strong>📬 Activa las notificaciones</strong>
              <p className="mb-2 mt-2">
                Recibe alertas instantáneas sobre:
              </p>
              <ul className="mb-0">
                <li>Productos sin stock</li>
                <li>Stock bajo en productos importantes</li>
                <li>Actualizaciones importantes del inventario</li>
              </ul>
            </Alert>

            <Button 
              variant="primary" 
              onClick={handleEnableNotifications}
              disabled={loading}
              className="w-100"
            >
              {loading ? 'Solicitando permisos...' : 'Activar Notificaciones'}
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <Alert variant="danger">
            <strong>❌ Notificaciones bloqueadas</strong>
            <p className="mb-0 mt-2">
              Has bloqueado las notificaciones. Para activarlas:
              <br />
              1. Ve a la configuración de tu navegador
              <br />
              2. Busca permisos del sitio
              <br />
              3. Permite las notificaciones para esta aplicación
            </p>
          </Alert>
        )}

        {permission === 'granted' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <FaCheck className="text-success me-2" />
                <strong>Notificaciones activadas</strong>
              </div>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleTestNotification}
              >
                Enviar prueba
              </Button>
            </div>

            <hr />

            <h6 className="mb-3">⚙️ Configuración de alertas</h6>

            <Form>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="outOfStock"
                  label="Alertas de productos sin stock"
                  checked={settings.outOfStock}
                  onChange={(e) => handleSettingChange('outOfStock', e.target.checked)}
                />
                <Form.Text className="text-muted">
                  Notificar cuando un producto se quede sin stock
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="lowStock"
                  label="Alertas de stock bajo"
                  checked={settings.lowStock}
                  onChange={(e) => handleSettingChange('lowStock', e.target.checked)}
                />
                <Form.Text className="text-muted">
                  Notificar cuando el stock esté por debajo del umbral
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="productUpdates"
                  label="Actualizaciones de productos"
                  checked={settings.productUpdates}
                  onChange={(e) => handleSettingChange('productUpdates', e.target.checked)}
                />
                <Form.Text className="text-muted">
                  Notificar cuando se agreguen, modifiquen o eliminen productos
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Frecuencia de verificación</Form.Label>
                <Form.Select
                  value={settings.checkInterval}
                  onChange={(e) => handleSettingChange('checkInterval', parseInt(e.target.value))}
                >
                  <option value={15}>Cada 15 minutos</option>
                  <option value={30}>Cada 30 minutos</option>
                  <option value={60}>Cada hora</option>
                  <option value={120}>Cada 2 horas</option>
                  <option value={240}>Cada 4 horas</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Con qué frecuencia verificar el estado del inventario
                </Form.Text>
              </Form.Group>
            </Form>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default NotificationSettings;