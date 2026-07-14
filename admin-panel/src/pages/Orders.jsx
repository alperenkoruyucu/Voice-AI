import { useState, useEffect } from 'react';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

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

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 });

  // Detail Modal & Lifecycle States
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Read: Fetch Paginated & Filtered Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await api.get(`/orders?${params.toString()}`);
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
      console.error("Siparişler çekilemedi:", err);
      setError("Sipariş listesi yüklenirken bir hata oluştu. Bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, dateFilter]);

  // Read: Fetch Single Order Detail
  const handleOpenDetail = async (id) => {
    setSelectedOrderId(id);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrderDetail(res.data);
    } catch (err) {
      console.error("Detay çekilemedi:", err);
      setDetailError("Sipariş detayı yüklenirken bir hata oluştu.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
    setDetailError(null);
  };

  // Update Status: Lifecycle Action
  const handleUpdateStatus = async (targetStatus) => {
    if (!orderDetail) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/orders/${orderDetail.id}/status`, { status: targetStatus });
      setOrderDetail((prev) => ({ ...prev, status: res.data.status || targetStatus }));
      fetchOrders();
    } catch (err) {
      alert("Durum güncellenemedi: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusChange = (e) => { setStatusFilter(e.target.value); setPage(1); };
  const handleDateChange = (e) => { setDateFilter(e.target.value); setPage(1); };
  const handleResetFilters = () => { setStatusFilter(''); setDateFilter(''); setPage(1); };

  return (
    <div className="p-6 md:p-8 space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sipariş Yönetimi</h1>
          <p className="text-gray-600 mt-1">Gelen siparişleri filtreleyin, detaylarını inceleyin ve süreçlerini yönetin.</p>
        </div>
        <div className="text-sm font-semibold bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-200 self-start md:self-auto shadow-sm">
          Toplam {meta.totalItems} Sipariş Kayıtlı
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Duruma Göre Filtrele</label>
            <select value={statusFilter} onChange={handleStatusChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none">
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
            <input type="date" value={dateFilter} onChange={handleDateChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        {(statusFilter || dateFilter) && (
          <button onClick={handleResetFilters} className="text-sm font-medium text-red-600 hover:text-red-800 underline self-end md:self-center px-2 py-1">
            Filtreleri Temizle ✕
          </button>
        )}
      </div>

      {/* Orders Table with Responsive Polish */}
      {loading ? (
        <LoadingSpinner message="Siparişler yükleniyor..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : orders.length === 0 ? (
        <EmptyState 
          title="Sipariş Bulunamadı" 
          message="Seçtiğiniz tarih veya durum kriterlerine uygun bir sipariş kaydı yok. Filtreleri sıfırlayarak tüm listeyi görebilirsiniz."
          actionLabel={(statusFilter || dateFilter) ? "Tüm Siparişleri Göster" : undefined}
          onAction={handleResetFilters}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-6">Sipariş ID</th>
                  <th className="py-3 px-6">Müşteri</th>
                  <th className="py-3 px-6">Tarih / Saat</th>
                  <th className="py-3 px-6">Toplam Tutar</th>
                  <th className="py-3 px-6 text-center">Durum</th>
                  <th className="py-3 px-6 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {orders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">#{order.id}</td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800">{order.customer?.name || 'Misafir Müşteri'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{order.customer?.phoneNumber || 'Telefon Yok'}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        <div className="font-semibold text-gray-800 mt-0.5">
                          {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-gray-900">
                        ₺{Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>● {statusInfo.label}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenDetail(order.id)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors border border-blue-200 shadow-sm"
                        >
                          🔍 İncele / Yönet
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Sayfa <span className="font-bold text-gray-900">{meta.currentPage}</span> / <span className="font-bold text-gray-900">{meta.totalPages}</span>
              <span className="ml-2 text-xs text-gray-400">({meta.totalItems} sonuçtan listeleniyor)</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 transition-colors shadow-sm">← Önceki</button>
              <button onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))} disabled={page >= meta.totalPages} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 transition-colors shadow-sm">Sonraki →</button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail & State Machine Lifecycle Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg">Sipariş Detayı #{selectedOrderId}</h3>
                {orderDetail && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[orderDetail.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_CONFIG[orderDetail.status]?.label || orderDetail.status}
                  </span>
                )}
              </div>
              <button onClick={handleCloseDetail} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {detailLoading ? (
                <div className="py-12"><LoadingSpinner message="Sipariş detayları getiriliyor..." /></div>
              ) : detailError ? (
                <ErrorMessage message={detailError} />
              ) : orderDetail ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Müşteri Bilgisi</span>
                      <p className="font-bold text-gray-900">{orderDetail.customer?.name || 'Misafir'}</p>
                      <p className="text-gray-600 mt-0.5">📞 {orderDetail.customer?.phoneNumber || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Teslimat Adresi</span>
                      <p className="font-medium text-gray-800">
                        {orderDetail.address ? `${orderDetail.address.street || ''} ${orderDetail.address.city || ''}`.trim() || 'Adres detayı yok' : 'Adres bilgisi bulunamadı'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sipariş Edilen Ürünler</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="py-2.5 px-4">Ürün Adı</th>
                            <th className="py-2.5 px-4 text-center">Adet</th>
                            <th className="py-2.5 px-4 text-right">Birim Fiyat</th>
                            <th className="py-2.5 px-4 text-right">Ara Toplam</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orderDetail.items?.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium text-gray-900">{item.menuItem?.name || `Ürün #${item.menuItemId}`}</td>
                              <td className="py-3 px-4 text-center font-bold text-gray-700">x{item.quantity}</td>
                              <td className="py-3 px-4 text-right text-gray-600">₺{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">₺{Number(item.subtotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 gap-2">
                    <div className="text-xs text-blue-800 font-medium">
                      💳 Ödeme Yöntemi: <span className="font-bold">Kapıda Ödeme / Nakit-Kart</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      Genel Toplam: <span className="text-2xl font-extrabold text-blue-600 ml-1">₺{Number(orderDetail.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {orderDetail && !detailLoading && !detailError && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <span className="text-xs font-semibold text-gray-500">
                  {updatingStatus ? '🔄 Statü güncelleniyor...' : 'Süreç Aksiyonları (State Machine):'}
                </span>

                <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                  {orderDetail.status === 'RECEIVED' && (
                    <>
                      <button onClick={() => handleUpdateStatus('PREPARING')} disabled={updatingStatus} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow disabled:opacity-50">👨‍🍳 Hazırlanıyor'a Geçir</button>
                      <button onClick={() => handleUpdateStatus('CANCELLED')} disabled={updatingStatus} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">✕ İptal Et</button>
                    </>
                  )}

                  {orderDetail.status === 'PREPARING' && (
                    <>
                      <button onClick={() => handleUpdateStatus('DELIVERING')} disabled={updatingStatus} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow disabled:opacity-50">🛵 Yola Çıktı / Dağıtımda</button>
                      <button onClick={() => handleUpdateStatus('CANCELLED')} disabled={updatingStatus} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">✕ İptal Et</button>
                    </>
                  )}

                  {orderDetail.status === 'DELIVERING' && (
                    <button onClick={() => handleUpdateStatus('COMPLETED')} disabled={updatingStatus} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors shadow disabled:opacity-50">🎉 Teslim Edildi / Tamamla</button>
                  )}

                  {(orderDetail.status === 'COMPLETED' || orderDetail.status === 'CANCELLED') && (
                    <span className="text-xs font-bold italic text-gray-400 py-2">Bu sipariş kapanmıştır, statü değiştirilemez.</span>
                  )}

                  <button onClick={handleCloseDetail} className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm transition-colors ml-2">Kapat</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}