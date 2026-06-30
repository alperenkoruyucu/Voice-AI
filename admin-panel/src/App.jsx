import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import MenuManager from './pages/MenuManager';

function App() {
  return (
    <BrowserRouter>
      <nav className="bg-gray-800 p-4 text-white flex gap-4 shadow-lg">
        <Link to="/" className="hover:text-blue-400 font-semibold transition-colors">Ana Sayfa</Link>
        <Link to="/menu" className="hover:text-blue-400 font-semibold transition-colors">Menü Yönetimi</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;