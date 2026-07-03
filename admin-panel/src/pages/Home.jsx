import { useState, useEffect } from 'react';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Home() {
  const [stats, setStats] = useState({
    todayOrderCount: 0,
    pendingOrderCount: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/orders/stats');
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error("Metrikler çekilemedi:", err);
        setError("Dashboard verileri yüklenirken bir hata oluştu. Lütfen oturumunuzu kontrol edin.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Günlük metrikler hesaplanıyor..." />;
  if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Genel Bakış</h1>
        <p className="text-gray-600 mt-1">Restoranın bugünkü canlı performans özetleri.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Bugünkü Siparişler</p>
            <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{stats.todayOrderCount || 0}</h3>
          </div>
          <div className="p-4 bg-blue-50 rounded-full text-blue-600 font-bold text-xl">
            📦
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Bekleyen Siparişler</p>
            <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{stats.pendingOrderCount || 0}</h3>
          </div>
          <div className="p-4 bg-amber-50 rounded-full text-amber-600 font-bold text-xl">
            ⏳
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Toplam Ciro</p>
            <h3 className="text-3xl font-extrabold text-gray-800 mt-2">
              ₺{Number(stats.totalRevenue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h3> 
          </div>
          <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 font-bold text-xl">
            💰
          </div>
        </div>

      </div>
    </div>
  );
}