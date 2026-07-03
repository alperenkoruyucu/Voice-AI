import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AppLayout() {
    const location = useLocation();

    const navigation = [
        { name: 'Genel Bakış', href: '/'},
        { name: 'Siparişler', href: '/orders'},
        { name: 'Menü', href: '/menu'},
        { name: 'Müşteriler', href: '/customers'},
        { name: 'Çağrılar', href: '/calls'},
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
          
          <aside className="w-full md:w-64 bg-gray-900 text-white shadow-xl flex flex-col">
            <div className="p-6 text-center md:text-left border-b border-gray-800">
              <h2 className="text-2xl font-bold text-blue-400 tracking-wider">VOICE AI</h2>
              <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-hidden">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                      isActive 
                        ? 'bg-blue-600 text-white font-semibold' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
    
          <main className="flex-1 overflow-y-auto">
            <Outlet /> 
          </main>
          
        </div>
      );
    }