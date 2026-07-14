import { useState, useEffect } from 'react';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Read: Fetch Menu from Backend
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');
      
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      } else if (res.data && Array.isArray(res.data.menu)) {
        setCategories(res.data.menu);
      } else {
        setCategories([]);
      }
      setError(null);
    } catch (err) {
      console.error("Menü çekilemedi:", err);
      setError("Menü listesi yüklenirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Form Handlers
  const handleOpenAddModal = (categoryId = '') => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: categoryId || (categories[0]?.id || ''),
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item, categoryId) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: categoryId,
      isAvailable: item.isAvailable ?? true,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Create & Update: Save Item via API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId, 10),
      };

      if (editingItem) {
        await api.put(`/menu/items/${editingItem.id}`, payload);
      } else {
        await api.post('/menu/items', payload);
      }

      await fetchMenu();
      handleCloseModal();
    } catch (err) {
      alert("İşlem başarısız: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Optimistic UI Toggle: Instant Status Change
  const handleToggleAvailable = async (item, categoryId) => {
    const newStatus = !item.isAvailable;
    
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map((i) => (i.id === item.id ? { ...i, isAvailable: newStatus } : i)),
        };
      })
    );

    try {
      await api.put(`/menu/items/${item.id}`, {
        ...item,
        isAvailable: newStatus,
        price: parseFloat(item.price),
      });
    } catch (err) {
      alert("Durum güncellenemedi, eski haline dönülüyor.");
      fetchMenu(); // Revert back on error
    }
  };

  // Soft-Delete Shield
  const handleDelete = async (itemId) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/menu/items/${itemId}`);
      fetchMenu();
    } catch (err) {
      alert("Silinemedi (Aktif/Geçmiş siparişlerde kullanıldığı için pasife çekilmiş olabilir): " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Menü Yönetimi</h1>
          <p className="text-gray-600 mt-1">Restoran menüsünü düzenleyin, fiyat belirleyin veya ürünleri satışa kapatın.</p>
        </div>
        <button
          onClick={() => handleOpenAddModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2 text-sm"
        >
          <span>+</span> Yeni Ürün Ekle
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Menü yükleniyor..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : categories.length === 0 ? (
        <EmptyState 
          title="Menü Henüz Boş" 
          message="Sistemde tanımlı hiçbir kategori veya ürün bulunmuyor. Hemen yeni bir ürün ekleyerek menünüzü oluşturmaya başlayın."
          actionLabel="+ İlk Ürünü Ekle"
          onAction={() => handleOpenAddModal()}
        />
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold">{category.name}</h2>
                <span className="text-xs font-semibold bg-gray-800 px-3 py-1 rounded-full text-gray-300">
                  {category.items?.length || 0} Ürün
                </span>
              </div>

              {/* Items Table with Responsive Polish */}
              {!category.items || category.items.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">Bu kategoride henüz ürün yok.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                        <th className="py-3 px-6">Ürün Adı</th>
                        <th className="py-3 px-6">Fiyat</th>
                        <th className="py-3 px-6">Satış Durumu</th>
                        <th className="py-3 px-6 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {category.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-medium text-gray-900">
                            <div>{item.name}</div>
                            {item.description && <div className="text-xs text-gray-500 font-normal mt-0.5">{item.description}</div>}
                          </td>
                          <td className="py-4 px-6 font-bold text-gray-800">
                            ₺{Number(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleToggleAvailable(item, category.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                item.isAvailable
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                              }`}
                            >
                              {item.isAvailable ? '● Satışta' : '○ Tükendi / Kapalı'}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item, category.id)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingItem ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kategori</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" disabled>Kategori Seçin</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ürün Adı</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Örn: Antep Usulü Lahmacun"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                </input>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Açıklama (Opsiyonel)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="İçindekiler vb."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Fiyat (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                >
                </input>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isAvailable" className="font-semibold text-gray-700 cursor-pointer">
                  Müşteriler sipariş verebilsin (Satışta)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}