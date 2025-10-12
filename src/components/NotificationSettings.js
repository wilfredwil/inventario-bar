// src/components/NotificationSettings.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge, Collapse } from 'react-bootstrap';
import { FaBell, FaBellSlash, FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
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
    checkInterval: 60, // minutos
    scheduleType: 'interval', // 'interval' o 'weekly'
    weeklyDay: 1, // 0=Domingo, 1=Lunes, etc.
    weeklyTime: '09:00'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

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
        setMessage({ type: 'success', text: '✅ Notificaciones activadas' });
        
        // Enviar notificación de prueba
        await sendLocalNotification(
          '🎉 Notificaciones activadas',
          {
            body: 'Recibirás alertas importantes sobre tu inventario',
            tag: 'welcome-notification'
          }
        );
      } else {
        setMessage({ type: 'danger', text: '❌ Permisos denegados' });
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
      setMessage({ type: 'warning', text: 'Primero activa las notificaciones' });
      return;
    }

    await sendLocalNotification(
      '🧪 Notificación de prueba',
      {
        body: 'Esta es una notificación de prueba del sistema',
        tag: 'test-notification'
      }
    );

    setMessage({ type: 'info', text: '📬 Notificación enviada' });
    setTimeout(() => setMessage(null), 3000);
  };

  const getNextScheduledDay = (dayOfWeek, time) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = time.split(':').map(Number);
    const targetTime = hours * 60 + minutes;

    let daysUntil = dayOfWeek - currentDay;
    
    // Si es el mismo día pero ya pasó la hora
    if (daysUntil === 0 && currentTime >= targetTime) {
      daysUntil = 7;
    }
    
    // Si el día ya pasó esta semana
    if (daysUntil < 0) {
      daysUntil += 7;
    }

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntil);
    nextDate.setHours(hours, minutes, 0, 0);

    const dateStr = nextDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    return `${dateStr} a las ${time}`;
  };

  if (!supported) {
    return null;
  }

  const getStatusBadge = () => {
    if (permission === 'granted') {
      return <Badge bg="success" className="ms-2">Activadas</Badge>;
    } else if (permission === 'denied') {
      return <Badge bg="danger" className="ms-2">Bloqueadas</Badge>;
    }
    return <Badge bg="secondary" className="ms-2">Desactivadas</Badge>;
  };

  return (
    <>
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Header 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            cursor: 'pointer',
            background: 'var(--bg-secondary)',
            borderBottom: isOpen ? '1px solid var(--border-light)' : 'none',
            padding: '0.75rem 1rem'
          }}
          className="d-flex align-items-center justify-content-between"
        >
          <div className="d-flex align-items-center">
            <FaBell className="me-2" style={{ fontSize: '1rem', color: 'var(--text-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Notificaciones
            </span>
            {getStatusBadge()}
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </Card.Header>

      <Collapse in={isOpen}>
        <Card.Body style={{ padding: '1rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
          {message && (
            <Alert 
              variant={message.type} 
              dismissible 
              onClose={() => setMessage(null)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', marginBottom: '1rem' }}
            >
              {message.text}
            </Alert>
          )}

          {permission === 'default' && (
            <div className="mb-3">
              <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Activa las notificaciones para recibir alertas de stock bajo y productos agotados.
              </p>

              <Button 
                variant="primary" 
                onClick={handleEnableNotifications}
                disabled={loading}
                size="sm"
                className="w-100"
              >
                {loading ? 'Solicitando permisos...' : 'Activar Notificaciones'}
              </Button>
            </div>
          )}

          {permission === 'denied' && (
            <Alert variant="danger" style={{ padding: '0.75rem', fontSize: '0.85rem', marginBottom: 0 }}>
              <strong>Notificaciones bloqueadas</strong>
              <p className="mb-0 mt-2" style={{ fontSize: '0.8rem' }}>
                Ve a la configuración de tu navegador para permitir notificaciones.
              </p>
            </Alert>
          )}

          {permission === 'granted' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div className="d-flex align-items-center">
                  <FaCheck className="text-success me-2" />
                  <small style={{ fontWeight: 600 }}>Notificaciones activas</small>
                </div>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={handleTestNotification}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                >
                  Probar
                </Button>
              </div>

              <Form>
                <Form.Group className="mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label style={{ fontSize: '0.85rem', marginBottom: 0, color: 'var(--text-primary)' }}>
                      Productos sin stock
                    </Form.Label>
                    <Form.Check
                      type="switch"
                      id="outOfStock"
                      checked={settings.outOfStock}
                      onChange={(e) => handleSettingChange('outOfStock', e.target.checked)}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label style={{ fontSize: '0.85rem', marginBottom: 0, color: 'var(--text-primary)' }}>
                      Stock bajo
                    </Form.Label>
                    <Form.Check
                      type="switch"
                      id="lowStock"
                      checked={settings.lowStock}
                      onChange={(e) => handleSettingChange('lowStock', e.target.checked)}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label style={{ fontSize: '0.85rem', marginBottom: 0, color: 'var(--text-primary)' }}>
                      Actualizaciones de productos
                    </Form.Label>
                    <Form.Check
                      type="switch"
                      id="productUpdates"
                      checked={settings.productUpdates}
                      onChange={(e) => handleSettingChange('productUpdates', e.target.checked)}
                    />
                  </div>
                </Form.Group>

                <hr style={{ margin: '0.75rem 0' }} />

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    📅 Programación de verificaciones
                  </Form.Label>
                  
                  <div className="mb-2">
                    <Form.Check
                      type="radio"
                      id="scheduleInterval"
                      name="scheduleType"
                      label="Verificar cada cierto tiempo"
                      checked={settings.scheduleType === 'interval'}
                      onChange={() => handleSettingChange('scheduleType', 'interval')}
                      style={{ fontSize: '0.85rem' }}
                      className="text-label"
                    />
                  </div>

                  {settings.scheduleType === 'interval' && (
                    <Form.Select
                      value={settings.checkInterval}
                      onChange={(e) => handleSettingChange('checkInterval', parseInt(e.target.value))}
                      size="sm"
                      className="mb-2"
                      style={{ marginLeft: '1.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-light)' }}
                    >
                      <option value={15}>Cada 15 minutos</option>
                      <option value={30}>Cada 30 minutos</option>
                      <option value={60}>Cada 1 hora</option>
                      <option value={120}>Cada 2 horas</option>
                      <option value={240}>Cada 4 horas</option>
                    </Form.Select>
                  )}

                  <div className="mb-2">
                    <Form.Check
                      type="radio"
                      id="scheduleWeekly"
                      name="scheduleType"
                      label="Verificar un día específico de la semana"
                      checked={settings.scheduleType === 'weekly'}
                      onChange={() => handleSettingChange('scheduleType', 'weekly')}
                      style={{ fontSize: '0.85rem' }}
                      className="text-label"
                    />
                  </div>

                  {settings.scheduleType === 'weekly' && (
                    <div style={{ marginLeft: '1.5rem' }}>
                      <Form.Select
                        value={settings.weeklyDay}
                        onChange={(e) => handleSettingChange('weeklyDay', parseInt(e.target.value))}
                        size="sm"
                        className="mb-2"
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-light)' }}
                      >
                        <option value={1}>Lunes</option>
                        <option value={2}>Martes</option>
                        <option value={3}>Miércoles</option>
                        <option value={4}>Jueves</option>
                        <option value={5}>Viernes</option>
                        <option value={6}>Sábado</option>
                        <option value={0}>Domingo</option>
                      </Form.Select>

                      <Form.Group>
                        <Form.Label style={{ fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                          Hora:
                        </Form.Label>
                        <Form.Control
                          type="time"
                          value={settings.weeklyTime}
                          onChange={(e) => handleSettingChange('weeklyTime', e.target.value)}
                          size="sm"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-light)' }}
                        />
                      </Form.Group>
                    </div>
                  )}
                </Form.Group>

                {settings.scheduleType === 'weekly' && (
                  <Alert variant="info" style={{ padding: '0.5rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    💡 <strong>Próxima verificación:</strong>{' '}
                    {getNextScheduledDay(settings.weeklyDay, settings.weeklyTime)}
                  </Alert>
                )}
              </Form>
            </>
          )}
        </Card.Body>
      </Collapse>
    </Card>

    <style>{`
      /* Estilos para modo oscuro en Form.Check */
      body.dark-mode .form-check-label {
        color: var(--text-primary) !important;
      }
      
      body.dark-mode .form-check-input {
        background-color: var(--bg-tertiary);
        border-color: var(--border-medium);
      }
      
      body.dark-mode .form-check-input:checked {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
      }
      
      body.dark-mode .form-select option {
        background-color: var(--bg-primary);
        color: var(--text-primary);
      }
    `}</style>
  </>
  );
}

export default NotificationSettings;