import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/index';
import PrivateRoute from './routes/PrivateRoute';

// Pages
import Login from './components/pages/Login';
import Inativo from './components/pages/Inativo';
import Catalogo from './components/pages/Catalogo';
import Pedidos from './components/pages/Pedidos';
import Livros from './components/pages/Livros';
import Autores from './components/pages/Autores';
import Categorias from './components/pages/Categorias';
import Usuarios from './components/pages/Usuarios';
import MeuPerfil from './components/pages/MeuPerfil';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/inativo" element={<Inativo />} />

            {/* Protected routes */}
            <Route
              path="/catalogo"
              element={
                <PrivateRoute>
                  <Catalogo />
                </PrivateRoute>
              }
            />

            <Route
              path="/pedidos"
              element={
                <PrivateRoute>
                  <Pedidos />
                </PrivateRoute>
              }
            />

            <Route
              path="/livros"
              element={
                <PrivateRoute requiredPerfil={['admin', 'colab']}>
                  <Livros />
                </PrivateRoute>
              }
            />

            <Route
              path="/autores"
              element={
                <PrivateRoute requiredPerfil={['admin', 'colab']}>
                  <Autores />
                </PrivateRoute>
              }
            />

            <Route
              path="/categorias"
              element={
                <PrivateRoute requiredPerfil={['admin', 'colab']}>
                  <Categorias />
                </PrivateRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <PrivateRoute requiredPerfil="admin">
                  <Usuarios />
                </PrivateRoute>
              }
            />

            <Route
              path="/meu-perfil"
              element={
                <PrivateRoute>
                  <MeuPerfil />
                </PrivateRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/catalogo" replace />} />
            <Route path="*" element={<Navigate to="/catalogo" replace />} />
          </Routes>

          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
