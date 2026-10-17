import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Стан користувача (зчитуємо з localStorage при завантаженні)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  // Модалки
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Форма авторизації
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('user');
  const [authError, setAuthError] = useState('');

  // Форми додавання
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newRegionName, setNewRegionName] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/categories').then(res => setCategories(res.data));
    axios.get('http://localhost:5000/api/regions').then(res => setRegions(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = 'http://localhost:5000/api/promotions?';
    if (selectedCategory) url += `category_id=${selectedCategory}&`;
    if (selectedRegion) url += `region_id=${selectedRegion}&`;

    axios.get(url)
      .then(res => { setPromotions(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedCategory, selectedRegion]);

  // Обробка входу / реєстрації
  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError('');

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode
      ? { email: authEmail, password: authPassword, full_name: authName, role: authRole }
      : { email: authEmail, password: authPassword };

    axios.post(`http://localhost:5000${endpoint}`, payload)
      .then(res => {
        const { user, token } = res.data;
        setCurrentUser(user);
        setToken(token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
      })
      .catch(err => {
        setAuthError(err.response?.data?.error || 'Помилка авторизації');
      });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/categories', { name: newCatName, icon: newCatIcon })
      .then(res => {
        setCategories([...categories, res.data]);
        setNewCatName('');
        setShowCategoryModal(false);
      });
  };

  const handleAddRegion = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/regions', { name: newRegionName })
      .then(res => {
        setRegions([...regions, res.data]);
        setSelectedRegion(res.data.id);
        setNewRegionName('');
        setShowRegionModal(false);
      });
  };

  const activeRegionObj = regions.find(r => r.id === selectedRegion);

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1 className="logo">Promo</h1>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="region-select-btn" onClick={() => setShowRegionModal(true)}>
            📍 {activeRegionObj ? activeRegionObj.name : 'Усі міста'} ▾
          </button>

          {currentUser ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                👤 {currentUser.full_name} {currentUser.role === 'admin' ? '🛡️ (Адмін)' : ''}
              </span>
              <button className="btn-secondary" onClick={handleLogout}>Вийти</button>
            </div>
          ) : (
            <button className="button" style={{ width: 'auto' }} onClick={() => setShowAuthModal(true)}>
              Увійти / Реєстрація
            </button>
          )}
        </div>
      </header>

      {/* Категорії */}
      <div className="categories-bar">
        <button
          className={`category-pill ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          ✨ Всі
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}

        <button className="category-pill add-pill" onClick={() => setShowCategoryModal(true)}>
          + Додати категорію
        </button>
      </div>

      <main>
        <h2>Гарячі акції {activeRegionObj ? `у місті ${activeRegionObj.name}` : ''} 🔥</h2>

        {loading ? (
          <p>Завантаження...</p>
        ) : promotions.length === 0 ? (
          <p style={{ color: '#64748b' }}>Наразі немає активних акцій за цими фільтрами.</p>
        ) : (
          <div className="grid">
            {promotions.map((promo) => (
              <div key={promo.id} className="card">
                <div>
                  <span className="badge">{promo.discount_value}</span>
                  <h3 className="card-title">{promo.title}</h3>
                  <p className="card-desc">{promo.description}</p>
                  <div className="place-info">🏬 {promo.place_name}</div>
                  <div className="address">📍 {promo.address} ({promo.region_name})</div>
                </div>
                <button className="button">Отримати пропозицію</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модалка Авторизації */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{isRegisterMode ? 'Створення акаунту' : 'Вхід у систему'}</h3>

            {authError && <p style={{ color: '#ff6b6b', fontSize: '14px' }}>{authError}</p>}

            <form onSubmit={handleAuth}>
              {isRegisterMode && (
                <>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="ПІБ або Назва закладу"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    required
                  />
                  <select
                    className="input-field"
                    value={authRole}
                    onChange={e => setAuthRole(e.target.value)}
                  >
                    <option value="user">Користувач</option>
                    <option value="merchant">Представник закладу</option>
                    <option value="admin">Адміністратор 🛡️</option>
                  </select>
                </>
              )}

              <input
                className="input-field"
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                required
              />
              <input
                className="input-field"
                type="password"
                placeholder="Пароль"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                required
              />

              <div className="modal-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                <button type="submit" className="button">
                  {isRegisterMode ? 'Зареєструватися' : 'Увійти'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                >
                  {isRegisterMode ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Зареєструватися'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAuthModal(false)}>
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалки додавання категорій та регіонів */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Додати нову категорію</h3>
            <form onSubmit={handleAddCategory}>
              <input className="input-field" type="text" placeholder="Іконка (наприклад 🍕)" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} />
              <input className="input-field" type="text" placeholder="Назва категорії" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCategoryModal(false)}>Скасувати</button>
                <button type="submit" className="button" style={{ width: 'auto' }}>Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Оберіть або додайте місто</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <button className="category-pill" style={{ justifyContent: 'center' }} onClick={() => { setSelectedRegion(null); setShowRegionModal(false); }}>🌍 Усі міста</button>
              {regions.map(r => (
                <button key={r.id} className={`category-pill ${selectedRegion === r.id ? 'active' : ''}`} style={{ justifyContent: 'center' }} onClick={() => { setSelectedRegion(r.id); setShowRegionModal(false); }}>
                  📍 {r.name}
                </button>
              ))}
            </div>
            <form onSubmit={handleAddRegion}>
              <input className="input-field" type="text" placeholder="Назва міста" value={newRegionName} onChange={e => setNewRegionName(e.target.value)} required />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRegionModal(false)}>Закрити</button>
                <button type="submit" className="button" style={{ width: 'auto' }}>+ Додати</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;