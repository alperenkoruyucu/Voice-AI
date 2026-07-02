import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import MenuManager from './pages/MenuManager';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Calls from './pages/Calls';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/menu" element={<MenuManager />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/calls" element={<Calls />} />
          </Route>        
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;