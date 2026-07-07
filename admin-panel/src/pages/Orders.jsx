import { useState, useEffect } from 'react';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Badge label and color mapping per order status
const STATUS_CONFIG = {
  RECEIVED: { label: 'Yeni Alındı', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  PREPARING: { label: 'Hazırlanıyor', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  DELIVERING: { label: 'Yolda / Dağıtımda', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  COMPLETED: { label: 'Tamamlandı', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800 border-red-200' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FILTER & PAGINATION STATE ---
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [meta, setMeta] = useState({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        limit: limit,
      });

      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await api.get(`/orders?${params.toString()}`);

      // Normalize response shape — handle paginated or plain-array responses
      if (res.data && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
        setMeta(res.data.meta || { totalItems: 0, currentPage: 1, totalPages: 1 });
      } else if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('An error occurred while loading orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, dateFilter]);

  // Reset to page 1 whenever a filter changes to avoid landing on an empty page
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleDateChange = (e) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setDateFilter('');
    setPage(1);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sipariş Yönetimi</h1>
          <p className="text-gray-600 mt-1">Gelen siparişleri filtreleyin, durumlarını takip edin ve geçmişi inceleyin.</p>
        </div>
        <div className="text-sm font-semibold bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-200 self-start md:self-auto">
          Toplam {meta.totalItems} Sipariş Kayıtlı
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Duruma Göre Filtrele</label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Tüm Durumlar</option>
              <option value="RECEIVED">Yeni Alındı</option>
              <option value="PREPARING">Hazırlanıyor</option>
              <option value="DELIVERING">Yolda / Dağıtımda</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="CANCELLED">İptal Edildi</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Tarihe Göre Filtrele</label>
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {(statusFilter || dateFilter) && (
          <button
            onClick={handleResetFilters}
            className="text-sm font-medium text-red-600 hover:text-red-800 underline self-end md:self-center px-2 py-1"
          >
            Filtreleri Temizle ✕
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Siparişler yükleniyor..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow border border-gray-200">
          <p className="text-gray-500 text-lg">Aradığınız kriterlere uygun sipariş bulunamadı.</p>
          {(statusFilter || dateFilter) && (
            <button onClick={handleResetFilters} className="mt-2 text-blue-600 hover:underline text-sm font-semibold">
              Tüm siparişleri göster
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-6">Sipariş ID</th>
                  <th className="py-3 px-6">Müşteri</th>
                  <th className="py-3 px-6">Tarih / Saat</th>
                  <th className="py-3 px-6">Toplam Tutar</th>
                  <th className="py-3 px-6 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {orders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || { 
                    label: order.status, 
                    color: 'bg-gray-100 text-gray-800' 
                  };

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">
                        #{order.id}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800">
                          {order.customer?.name || 'Misafir Müşteri'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {order.customer?.phoneNumber || 'Telefon Yok'}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-gray-600 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                        <div className="font-semibold text-gray-800 mt-0.5">
                          {new Date(order.createdAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-gray-900">
                        ₺{Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                          ● {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Sayfa <span className="font-bold text-gray-900">{meta.currentPage}</span> / <span className="font-bold text-gray-900">{meta.totalPages}</span> 
              <span className="ml-2 text-xs text-gray-400">({meta.totalItems} sonuçtan listeleniyor)</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Önceki
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sonraki →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}