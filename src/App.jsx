import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [favorites, setFavorites] = useState([]); // ID збережених акцій

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [loading, setLoading] = useState(true);

  // Стан користувача
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

  // Поля авторизації
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('user');
  const [authError, setAuthError] = useState('');

  // Поля додавання категорій/міст
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newRegionName, setNewRegionName] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/categories').then(res => setCategories(res.data));
    axios.get('http://localhost:5000/api/regions').then(res => setRegions(res.data));
  }, []);

  // Отримання списку акцій
  useEffect(() => {
    setLoading(true);
    let url = 'http://localhost:5000/api/promotions?';
    if (selectedCategory) url += `category_id=${selectedCategory}&`;
    if (selectedRegion) url += `region_id=${selectedRegion}&`;

    axios.get(url)
      .then(res => { setPromotions(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedCategory, selectedRegion]);

  // Завантаження обраних акцій користувача
  useEffect(() => {
    if (currentUser && token) {
      axios.get('http://localhost:5000/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          // Зберігаємо масив ID обраних акцій
          const favIds = res.data.map(item => item.promotion_id);
          setFavorites(favIds);
        })
        .catch(err => console.error('Помилка завантаження обраного:', err));
    } else {
      setFavorites([]);
    }
  }, [currentUser, token]);

  // Перемикання Обраного (додати / видалити)
  const toggleFavorite = (promoId) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const isFav = favorites.includes(promoId);

    if (isFav) {
      // Видалення з обраного
      axios.delete(`http://localhost:5000/api/favorites/${promoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          setFavorites(favorites.filter(id => id !== promoId));
        });
    } else {
      // Додавання в обране
      axios.post('http://localhost:5000/api/favorites', { promotion_id: promoId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          setFavorites([...favorites, promoId]);
        });
    }
  };

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
    setFavorites([]);
    setShowOnlyFavorites(false);
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

  // Фільтрація акцій (за всіма фільтрами + режим "Обране")
  const displayedPromotions = showOnlyFavorites
    ? promotions.filter(p => favorites.includes(p.id))
    : promotions;

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1 className="logo" style={{ cursor: 'pointer' }} onClick={() => setShowOnlyFavorites(false)}>
          LocaSale 🏷️
        </h1>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="region-select-btn" onClick={() => setShowRegionModal(true)}>
            📍 {activeRegionObj ? activeRegionObj.name : 'Усі міста'} ▾
          </button>

          {currentUser ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                👤 {currentUser.full_name} {currentUser.role === 'admin' ? '🛡️' : ''}
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

      {/* Панель категорій */}
      <div className="categories-bar">
        <button
          className={`category-pill ${selectedCategory === null && !showOnlyFavorites ? 'active' : ''}`}
          onClick={() => { setSelectedCategory(null); setShowOnlyFavorites(false); }}
        >
          ✨ Всі
        </button>

        {currentUser && (
          <button
            className={`category-pill ${showOnlyFavorites ? 'active' : ''}`}
            style={{ backgroundColor: showOnlyFavorites ? '#ef4444' : '', color: showOnlyFavorites ? '#fff' : '' }}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            ❤️ Моє обране ({favorites.length})
          </button>
        )}

        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.id && !showOnlyFavorites ? 'active' : ''}`}
            onClick={() => { setSelectedCategory(cat.id); setShowOnlyFavorites(false); }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}

        <button className="category-pill add-pill" onClick={() => setShowCategoryModal(true)}>
          + Додати категорію
        </button>
      </div>

      <main>
        <h2>
          {showOnlyFavorites ? '❤️ Ваші збережені акції' : `Гарячі акції ${activeRegionObj ? `у місті ${activeRegionObj.name}` : ''} 🔥`}
        </h2>

        {loading ? (
          <p>Завантаження...</p>
        ) : displayedPromotions.length === 0 ? (
          <p style={{ color: '#64748b' }}>
            {showOnlyFavorites
              ? 'У вас поки немає збережених акцій. Натисніть ❤️ на картці акції, щоб додати її сюди!'
              : 'Наразі немає активних акцій за цими фільтрами.'}
          </p>
        ) : (
          <div className="grid">
            {displayedPromotions.map((promo) => {
              const isFav = favorites.includes(promo.id);
              return (
                <div key={promo.id} className="card" style={{ position: 'relative' }}>
                  <button
                    onClick={() => toggleFavorite(promo.id)}
                    title={isFav ? "Видалити з обраного" : "Додати в обране"}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      fontSize: '18px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>

                  <div>
                    <span className="badge">{promo.discount_value}</span>
                    <h3 className="card-title" style={{ paddingRight: '30px' }}>{promo.title}</h3>
                    <p className="card-desc">{promo.description}</p>
                    <div className="place-info">🏬 {promo.place_name}</div>
                    <div className="address">📍 {promo.address} ({promo.region_name})</div>
                  </div>
                  <button className="button">Отримати пропозицію</button>
                </div>
              );
            })}
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

      {/* Модалки Категорій та Регіонів */}
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