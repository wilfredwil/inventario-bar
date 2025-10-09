// src/utils/notificationUtils.js

/**
 * Verifica si las notificaciones están soportadas
 */
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Obtiene el estado actual de los permisos de notificación
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Solicita permiso para enviar notificaciones
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    throw new Error('Las notificaciones no están soportadas en este navegador');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Los permisos de notificación fueron denegados previamente');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Envía una notificación local
 */
export const sendLocalNotification = async (title, options = {}) => {
  if (!isNotificationSupported()) {
    console.warn('Notificaciones no soportadas');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('No hay permisos para notificaciones');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  const notificationOptions = {
    body: options.body || '',
    icon: options.icon || '/logo192.png',
    badge: options.badge || '/logo192.png',
    vibrate: options.vibrate || [200, 100, 200],
    tag: options.tag || 'inventario-notification',
    requireInteraction: options.requireInteraction || false,
    data: options.data || {},
    ...options
  };

  await registration.showNotification(title, notificationOptions);
};

/**
 * Verifica el stock y envía notificaciones si es necesario
 */
export const checkStockAndNotify = async (inventory) => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const outOfStock = inventory.filter(item => item.stock === 0);
  const lowStock = inventory.filter(item => 
    item.stock > 0 && item.stock <= (item.umbral_low || 5)
  );

  // Notificar productos sin stock
  if (outOfStock.length > 0) {
    await sendLocalNotification(
      '⚠️ Productos sin stock',
      {
        body: `${outOfStock.length} producto${outOfStock.length > 1 ? 's' : ''} sin stock: ${outOfStock.slice(0, 3).map(p => p.nombre).join(', ')}${outOfStock.length > 3 ? '...' : ''}`,
        tag: 'out-of-stock',
        requireInteraction: true,
        data: { type: 'out-of-stock', products: outOfStock }
      }
    );
  }

  // Notificar productos con stock bajo
  if (lowStock.length > 0) {
    await sendLocalNotification(
      '📉 Stock bajo detectado',
      {
        body: `${lowStock.length} producto${lowStock.length > 1 ? 's con' : ' con'} stock bajo`,
        tag: 'low-stock',
        data: { type: 'low-stock', products: lowStock }
      }
    );
  }
};

/**
 * Programa verificaciones periódicas de stock
 */
export const scheduleStockChecks = (inventory, intervalMinutes = 60) => {
  // Verificación inmediata
  checkStockAndNotify(inventory);

  // Verificaciones periódicas
  const intervalId = setInterval(() => {
    checkStockAndNotify(inventory);
  }, intervalMinutes * 60 * 1000);

  return intervalId;
};

/**
 * Cancela las verificaciones programadas
 */
export const cancelStockChecks = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

/**
 * Notificación de producto específico
 */
export const notifyProductUpdate = async (product, action) => {
  if (Notification.permission !== 'granted') {
    return;
  }

  let title = '';
  let body = '';
  let emoji = '';

  switch (action) {
    case 'added':
      emoji = '✅';
      title = 'Producto agregado';
      body = `${product.nombre} fue agregado al inventario`;
      break;
    case 'updated':
      emoji = '✏️';
      title = 'Producto actualizado';
      body = `${product.nombre} - Stock: ${product.stock}`;
      break;
    case 'deleted':
      emoji = '🗑️';
      title = 'Producto eliminado';
      body = `${product.nombre} fue eliminado del inventario`;
      break;
    case 'low-stock':
      emoji = '⚠️';
      title = 'Stock bajo';
      body = `${product.nombre} tiene solo ${product.stock} unidades`;
      break;
    case 'out-of-stock':
      emoji = '❌';
      title = 'Sin stock';
      body = `${product.nombre} se ha agotado`;
      break;
    default:
      return;
  }

  await sendLocalNotification(
    `${emoji} ${title}`,
    {
      body,
      tag: `product-${product.id}-${action}`,
      data: { type: action, product }
    }
  );
};