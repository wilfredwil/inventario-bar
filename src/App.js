// src/App.js
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Container, Navbar, Nav, Button, Spinner } from 'react-bootstrap';
import Login from './components/Login';
import InventoryList from './components/InventoryList';
import Statistics from './components/Statistics';
import UserManagement from './components/UserManagement';
import ProviderManagement from './components/ProviderManagement';
import HistoryLog from './components/HistoryLog';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);

  // Listener de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Obtener rol del usuario
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', currentUser.email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setUserRole(userData.role || 'bartender');
        } else {
          setUserRole('bartender');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cargar inventario del bar
  useEffect(() => {
    if (!user) return;

    const inventoryRef = collection(db, 'inventario');
    const q = query(inventoryRef, orderBy('nombre'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => {
          const tipo = (item.tipo_inventario || '').toLowerCase();
          return tipo === 'bar' || 
                 ['licor', 'vino', 'cerveza', 'whisky', 'vodka', 'gin', 'ron', 'tequila'].includes(item.tipo?.toLowerCase());
        });
      
      setInventory(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Cargar proveedores
  useEffect(() => {
    if (!user) return;

    const loadProviders = async () => {
      try {
        const providersRef = collection(db, 'providers');
        const snapshot = await getDocs(providersRef);
        
        const providersData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => {
            // Aceptar tanto 'empresa' como 'nombre' (compatibilidad)
            const nombreEmpresa = p.empresa || p.nombre || '';
            return nombreEmpresa.trim() !== '';
          })
          .sort((a, b) => {
            const nameA = (a.empresa || a.nombre || '').toLowerCase();
            const nameB = (b.empresa || b.nombre || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        
        console.log('✅ Proveedores cargados:', providersData.length);
        setProviders(providersData);
      } catch (error) {
        console.error('❌ Error cargando proveedores:', error);
      }
    };

    loadProviders();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

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
    <div className="app-container">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container fluid>
          <Navbar.Brand>🍸 Inventario de Bar</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                active={activeView === 'inventory'} 
                onClick={() => setActiveView('inventory')}
              >
                Inventario
              </Nav.Link>
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
              {(userRole === 'admin' || userRole === 'manager') && (
                <>
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
              <Navbar.Text className="me-3">
                {user.email} ({userRole})
              </Navbar.Text>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
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
        {activeView === 'statistics' && (
          <Statistics inventory={inventory} />
        )}
        {activeView === 'history' && (
          <HistoryLog user={user} userRole={userRole} />
        )}
        {activeView === 'providers' && (userRole === 'admin' || userRole === 'manager') && (
          <ProviderManagement providers={providers} user={user} />
        )}
        {activeView === 'users' && userRole === 'admin' && (
          <UserManagement user={user} userRole={userRole} />
        )}
      </Container>
    </div>
  );
}

export default App;