import { useState, useEffect } from 'react';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Fetch initial list or search results
  const fetchCustomers = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery ? `/customers?search=${encodeURIComponent(searchQuery)}` : '/customers';
      const res = await api.get(url);
      
      // Handle potentially nested response data
      const data = res.data.data ? res.data.data : res.data;
      setCustomers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchCustomers('');
  };

  // Fetch complete customer profile including orders and addresses
  const handleOpenDetail = async (id) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedCustomer({ id }); // Temporary state to open modal immediately

    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (err) {
      setDetailError('Failed to load customer details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedCustomer(null);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Müşteriler</h1>
          <p className="text-gray-600 mt-1">Müşteri listesini ve sipariş geçmişlerini görüntüleyin.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="İsim veya telefon numarası (örn: 532...)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Ara
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Temizle
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Data Table */}
      {loading ? (
        <LoadingSpinner message="Müşteriler yükleniyor..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow border border-gray-200">
          <p className="text-gray-500 text-lg">Müşteri bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-6">ID</th>
                  <th className="py-3 px-6">Müşteri Adı</th>
                  <th className="py-3 px-6">Telefon</th>
                  <th className="py-3 px-6">Kayıt Tarihi</th>
                  <th className="py-3 px-6 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-bold text-gray-900">#{c.id}</td>
                    <td className="py-4 px-6 font-medium">{c.name || 'İsimsiz'}</td>
                    <td className="py-4 px-6 text-gray-600">{c.phoneNumber}</td>
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenDetail(c.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Detay / Geçmiş
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">Müşteri Profili #{selectedCustomer.id}</h3>
              <button onClick={handleCloseDetail} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {detailLoading ? (
                <div className="py-8"><LoadingSpinner message="Profil yükleniyor..." /></div>
              ) : detailError ? (
                <ErrorMessage message={detailError} />
              ) : (
                <>
                  {/* Customer Info Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Ad Soyad</p>
                      <p className="font-bold text-gray-900 text-lg">{selectedCustomer.name || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Telefon</p>
                      <p className="font-medium text-gray-800 text-lg">{selectedCustomer.phoneNumber}</p>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-gray-200 mt-2">
                      <p className="text-xs font-bold text-gray-400 uppercase">Kayıtlı Adresler</p>
                      {/* Plural "addresses" used everywhere here */}
                      {Array.isArray(selectedCustomer.addresses) && selectedCustomer.addresses.length > 0 ? (
                        <ul className="list-disc list-inside mt-1 text-gray-700 text-sm">
                          {selectedCustomer.addresses.map(addr => (
                            <li key={addr.id}>{addr.street}, {addr.city}</li>
                          ))}
                        </ul>
                      ) : selectedCustomer.addresses && !Array.isArray(selectedCustomer.addresses) ? (
                         <p className="mt-1 text-gray-700 text-sm">{selectedCustomer.addresses.street}, {selectedCustomer.addresses.city}</p>
                      ) : (
                        <p className="mt-1 text-gray-500 italic text-sm">Adres kaydı yok.</p>
                      )}
                    </div>
                  </div>

                  {/* Order History */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Sipariş Geçmişi</h4>
                    {!selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                      <p className="text-gray-500 text-sm">Bu müşteriye ait geçmiş sipariş bulunamadı.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedCustomer.orders.map((order) => (
                          <div key={order.id} className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-shadow">
                            
                            {/* Summary Information */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">Sipariş #{order.id}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(order.createdAt).toLocaleString('tr-TR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-700">
                                  {order.status}
                                </span>
                                <span className="font-bold text-blue-600">
                                  ₺{Number(order.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Ordered Items List */}
                            {order.items && order.items.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Sipariş İçeriği:</p>
                                <ul className="text-xs text-gray-700 space-y-1">
                                  {order.items.map(item => (
                                    <li key={item.id} className="flex justify-between items-center">
                                      <span>
                                        <span className="font-bold text-gray-900">{item.quantity}x</span> 
                                        {/* Display item name if available from backend, fallback to ID */}
                                        {item.menuItem?.name ? ` ${item.menuItem.name}` : ` Ürün (Kodu: ${item.menuItemId})`}
                                      </span>
                                      <span className="font-medium text-gray-600">
                                        ₺{Number(item.subtotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}