import { useState, useEffect } from 'react';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- MODAL (FORM) STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    price: '',
    isAvailable: true,
  });

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');

      // Normalize response shape — backend may return a plain array or a wrapped object
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      } else if (res.data && Array.isArray(res.data.menu)) {
        setCategories(res.data.menu);
      } else {
        console.error('Unexpected response format:', res.data);
        setCategories([]);
        setError('Unexpected data format received from server.');
      }
      
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError('An error occurred while loading the menu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // --- MODAL HANDLERS ---
  const handleOpenAddModal = (categoryId = '') => {
    setEditingItem(null);
    setFormData({
      categoryId: categoryId || (categories[0]?.id || ''),
      name: '',
      price: '',
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      categoryId: item.categoryId,
      name: item.name,
      price: item.price,
      isAvailable: item.isAvailable,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      categoryId: Number(formData.categoryId),
      name: formData.name,
      price: Number(formData.price),
      isAvailable: formData.isAvailable,
    };
    try {
      if (editingItem) {
        await api.put(`/menu/items/${editingItem.id}`, payload);
      } else {
        await api.post('/menu/items', payload);
      }
      handleCloseModal();
      fetchMenu();
    } catch (err) {
      alert('Operation failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      const newStatus = !item.isAvailable;
      await api.put(`/menu/items/${item.id}`, { isAvailable: newStatus });

      // Optimistic UI update — avoids a full refetch
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((i) =>
            i.id === item.id ? { ...i, isAvailable: newStatus } : i
          ),
        }))
      );
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    try {
      const res = await api.delete(`/menu/items/${itemId}`);
      // Soft-delete was triggered — item is part of active or historical orders
      if (res.data?.message && res.data.message.includes('Soft-deleted')) {
        alert('INFO: This item could not be permanently deleted because it exists in active or past orders. It has been marked as unavailable instead.');
      }
      fetchMenu();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <LoadingSpinner message="Menü yükleniyor..." />;
  if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Menü Yönetimi</h1>
          <p className="text-gray-600 mt-1">Restoran menüsünü düzenleyin, fiyat belirleyin veya ürünleri satışa kapatın.</p>
        </div>
        <button
          onClick={() => handleOpenAddModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span> Yeni Ürün Ekle
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow border border-gray-200">
          <p className="text-gray-500 text-lg">Henüz menüde hiçbir kategori veya ürün yok.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">{category.name}</h2>
                <span className="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-300">
                  {category.items?.length || 0} Ürün
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                      <th className="py-3 px-6">Ürün Adı</th>
                      <th className="py-3 px-6">Fiyat</th>
                      <th className="py-3 px-6 text-center">Satış Durumu</th>
                      <th className="py-3 px-6 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {(!category.items || category.items.length === 0) ? (
                      <tr>
                        <td colSpan="4" className="py-4 px-6 text-center text-gray-400 italic">
                          Bu kategoride henüz ürün bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      category.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-medium text-gray-900">{item.name}</td>
                          <td className="py-4 px-6 text-gray-700 font-semibold">
                            ₺{Number(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => handleToggleAvailable(item)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                item.isAvailable
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {item.isAvailable ? '● Satışta' : '○ Tükendi / Kapalı'}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-blue-600 hover:text-blue-800 font-medium py-1 px-3 rounded hover:bg-blue-50 transition-colors"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="text-red-600 hover:text-red-800 font-medium py-1 px-3 rounded hover:bg-red-50 transition-colors"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editingItem ? '✏️ Ürünü Düzenle' : '➕ Yeni Ürün Ekle'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="" disabled>Kategori Seçin</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Karışık Pizza"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Müşteriler bu ürünü sipariş verebilsin (Satışta)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors shadow"
                >
                  {editingItem ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}