// src/App.js
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Container, Navbar, Nav, Button, Spinner } from 'react-bootstrap';
import { FaMoon, FaSun, FaDownload } from 'react-icons/fa';
import Login from './components/Login';
import InventoryList from './components/InventoryList';
import Statistics from './components/Statistics';
import UserManagement from './components/UserManagement';
import ProviderManagement from './components/ProviderManagement';
import HistoryLog from './components/HistoryLog';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { ToastProvider } from './components/ToastNotification';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);
  
  // Estado para modo oscuro
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Estado para PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Aplicar modo oscuro al body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // PWA Install Prompt
  useEffect(() => {
    console.log('🔍 Esperando evento beforeinstallprompt...');
    
    const handleBeforeInstallPrompt = (e) => {
      console.log('✅ Evento beforeinstallprompt recibido!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA instalada correctamente');
      setShowInstallButton(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('ℹ️ App ya está instalada');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          const usersRef = collection(db, 'users');
          const snapshot = await getDocs(usersRef);
          const userDoc = snapshot.docs.find(doc => doc.data().email === currentUser.email);
          
          if (userDoc) {
            setUserRole(userDoc.data().role || 'guest');
          } else {
            setUserRole('guest');
          }
        } catch (error) {
          console.error('Error obteniendo rol:', error);
          setUserRole('guest');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función para ordenar el inventario
  const sortInventory = (items) => {
    return items.sort((a, b) => {
      if (a.importante && !b.importante) return -1;
      if (!a.importante && b.importante) return 1;
      
      const nameA = a.marca ? `${a.marca} ${a.nombre}` : a.nombre;
      const nameB = b.marca ? `${b.marca} ${b.nombre}` : b.nombre;
      
      return nameA.localeCompare(nameB);
    });
  };

  // Cargar inventario en tiempo real
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'inventario')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventory(sortInventory(items));
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Cargar proveedores en tiempo real
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'providers')),
      (snapshot) => {
        const providersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProviders(providersList);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        alert('Para instalar en iOS:\n\n1. Toca el botón Compartir (cuadrado con flecha)\n2. Selecciona "Añadir a pantalla de inicio"\n3. Toca "Añadir"');
      } else if (isAndroid) {
        alert('Para instalar:\n\n1. Abre el menú de Chrome (3 puntos)\n2. Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"');
      } else {
        alert('Para instalar esta aplicación, busca la opción "Instalar" en el menú de tu navegador');
      }
      return;
    }

    console.log('📱 Mostrando prompt de instalación...');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('📊 Resultado:', outcome);
    
    if (outcome === 'accepted') {
      console.log('✅ Usuario aceptó instalar la PWA');
    } else {
      console.log('❌ Usuario rechazó la instalación');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Verificar si el usuario tiene acceso a la sección avanzada
  const hasAdvancedAccess = userRole === 'admin' || userRole === 'manager';

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ToastProvider>
      <div className="app-container">
        <Navbar bg={darkMode ? "dark" : "light"} variant={darkMode ? "dark" : "light"} expand="lg" className="mb-4">
          <Container fluid className="d-flex align-items-center">
            <Navbar.Brand className="me-auto">🍸 Inventario de Bar</Navbar.Brand>
            
            {/* Botón de instalación PWA - SIEMPRE VISIBLE EN MÓVIL */}
            <Button 
              variant={darkMode ? "outline-success" : "success"}
              size="sm" 
              onClick={handleInstallClick}
              className="d-lg-none me-2"
              title="Instalar aplicación"
            >
              <FaDownload />
            </Button>
            
            <Navbar.Toggle aria-controls="navbar-nav" />
            
            <Navbar.Collapse id="navbar-nav">
              <Nav className="me-auto">
                <Nav.Link 
                  active={activeView === 'inventory'} 
                  onClick={() => setActiveView('inventory')}
                >
                  Inventario
                </Nav.Link>
                
                {/* Solo admin y manager pueden ver estas secciones */}
                {hasAdvancedAccess && (
                  <>
                    <Nav.Link 
                      active={activeView === 'statistics'} 
                      onClick={() => setActiveView('statistics')}
                    >
                      Estadísticas
                    </Nav.Link>
                    <Nav.Link 
                      active={activeView === 'history'} 
                      onClick={() => setActiveView('history')}
                    >
                      Historial
                    </Nav.Link>
                    <Nav.Link 
                      active={activeView === 'providers'} 
                      onClick={() => setActiveView('providers')}
                    >
                      Proveedores
                    </Nav.Link>
                    {userRole === 'admin' && (
                      <Nav.Link 
                        active={activeView === 'users'} 
                        onClick={() => setActiveView('users')}
                      >
                        Usuarios
                      </Nav.Link>
                    )}
                  </>
                )}
              </Nav>
              <Nav>
                {/* Botón de instalación para desktop */}
                {showInstallButton && (
                  <Button 
                    variant={darkMode ? "outline-success" : "success"}
                    size="sm" 
                    onClick={handleInstallClick}
                    className="me-2 d-none d-lg-inline-block"
                    title="Instalar aplicación"
                  >
                    <FaDownload className="me-1" />
                    <span>Instalar App</span>
                  </Button>
                )}
                
                <Button 
                  variant={darkMode ? "outline-light" : "outline-dark"}
                  size="sm" 
                  onClick={toggleDarkMode}
                  className="me-3"
                  title={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
                >
                  {darkMode ? <FaSun /> : <FaMoon />}
                </Button>
                
                <Navbar.Text className="me-3">
                  {user.email} ({userRole})
                </Navbar.Text>
                <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container fluid className="px-4">
          {activeView === 'inventory' && (
            <InventoryList 
              inventory={inventory} 
              user={user} 
              userRole={userRole}
              providers={providers}
            />
          )}
          {activeView === 'statistics' && hasAdvancedAccess && (
            <Statistics inventory={inventory} />
          )}
          {activeView === 'history' && hasAdvancedAccess && (
            <HistoryLog user={user} userRole={userRole} />
          )}
          {activeView === 'providers' && hasAdvancedAccess && (
            <ProviderManagement providers={providers} user={user} />
          )}
          {activeView === 'users' && userRole === 'admin' && (
            <UserManagement user={user} userRole={userRole} />
          )}
        </Container>
      </div>
    </ToastProvider>
  );
}

export default App;