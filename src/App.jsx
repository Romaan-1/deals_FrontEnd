import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [myPlaces, setMyPlaces] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [loading, setLoading] = useState(true);

  // Стан авторизованого користувача
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  // Стан модальних вікон
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Поля авторизації (роль admin виключена з вибору)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('user');
  const [authError, setAuthError] = useState('');

  // Поля додавання категорій та міст
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newRegionName, setNewRegionName] = useState('');

  // Поля створення закладу
  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [placeRegionId, setPlaceRegionId] = useState('');
  const [placeCategoryId, setPlaceCategoryId] = useState('');

  // Поля створення акції
  const [promoPlaceId, setPromoPlaceId] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('-20%');
  const [promoStartDate, setPromoStartDate] = useState('2026-10-18T00:00:00Z');
  const [promoEndDate, setPromoEndDate] = useState('2026-11-18T23:59:59Z');

  // Отримання списку акцій
  const fetchPromotions = () => {
    setLoading(true);
    let url = 'http://localhost:5000/api/promotions?';
    if (selectedCategory) url += `category_id=${selectedCategory}&`;
    if (selectedRegion) url += `region_id=${selectedRegion}&`;

    axios.get(url)
      .then(res => { setPromotions(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    axios.get('http://localhost:5000/api/categories').then(res => setCategories(res.data));
    axios.get('http://localhost:5000/api/regions').then(res => setRegions(res.data));
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [selectedCategory, selectedRegion]);

  // Завантаження даних при наявності авторизації
  useEffect(() => {
    if (currentUser && token) {
      axios.get('http://localhost:5000/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setFavorites(res.data.map(item => item.promotion_id)))
        .catch(err => console.error(err));

      if (currentUser.role === 'merchant' || currentUser.role === 'admin') {
        fetchMyPlaces();
      }
    } else {
      setFavorites([]);
      setMyPlaces([]);
    }
  }, [currentUser, token]);

  const fetchMyPlaces = () => {
    axios.get('http://localhost:5000/api/places/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMyPlaces(res.data))
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    axios.get('http://localhost:5000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setUsersList(res.data))
      .catch(err => console.error(err));
  };

  const handleRoleChange = (userId, newRole) => {
    axios.put(`http://localhost:5000/api/admin/users/${userId}/role`,
      { role: newRole },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        alert('Роль користувача успішно змінено!');
        fetchUsers();
      })
      .catch(err => alert(err.response?.data?.error || 'Помилка зміни ролі'));
  };

  const toggleFavorite = (promoId) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const isFav = favorites.includes(promoId);
    if (isFav) {
      axios.delete(`http://localhost:5000/api/favorites/${promoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => setFavorites(favorites.filter(id => id !== promoId)));
    } else {
      axios.post('http://localhost:5000/api/favorites', { promotion_id: promoId }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => setFavorites([...favorites, promoId]));
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
      .catch(err => setAuthError(err.response?.data?.error || 'Помилка авторизації'));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setFavorites([]);
    setShowOnlyFavorites(false);
  };

  const handleCreatePlace = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/places', {
      region_id: placeRegionId,
      category_id: placeCategoryId,
      name: placeName,
      address: placeAddress
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        alert('Заклад успішно додано!');
        setPlaceName('');
        setPlaceAddress('');
        fetchMyPlaces();
      })
      .catch(err => alert(err.response?.data?.error || 'Помилка створення закладу'));
  };

  const handleCreatePromotion = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/promotions', {
      place_id: promoPlaceId,
      title: promoTitle,
      description: promoDesc,
      discount_value: promoDiscount,
      start_date: promoStartDate,
      end_date: promoEndDate
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        alert('Акцію успішно опубліковано!');
        setPromoTitle('');
        setPromoDesc('');
        fetchPromotions();
        setShowMerchantModal(false);
      })
      .catch(err => alert(err.response?.data?.error || 'Помилка створення акції'));
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
  const displayedPromotions = showOnlyFavorites
    ? promotions.filter(p => favorites.includes(p.id))
    : promotions;

  return (
    <div className="container">
      {/* Шапка сайту */}
      <header className="header">
        <h1 className="logo" style={{ cursor: 'pointer' }} onClick={() => setShowOnlyFavorites(false)}>
          Promo
        </h1>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="region-select-btn" onClick={() => setShowRegionModal(true)}>
            📍 {activeRegionObj ? activeRegionObj.name : 'Усі міста'} ▾
          </button>

          {currentUser ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {currentUser.role === 'admin' && (
                <button
                  className="button"
                  style={{ width: 'auto', background: '#8b5cf6' }}
                  onClick={() => { setShowAdminModal(true); fetchUsers(); }}
                >
                  🛡️ Адмін-панель
                </button>
              )}
              {(currentUser.role === 'merchant' || currentUser.role === 'admin') && (
                <button className="button" style={{ width: 'auto', background: '#10b981' }} onClick={() => setShowMerchantModal(true)}>
                  🏬 Кабінет
                </button>
              )}
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
              ? 'У вас поки немає збережених акцій.'
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

      {/* Модальне вікно Адмін-панелі */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3>🛡️ Панель Адміністратора</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              Управління користувачами та надання ролей
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '8px' }}>ID</th>
                  <th style={{ padding: '8px' }}>Користувач</th>
                  <th style={{ padding: '8px' }}>Email</th>
                  <th style={{ padding: '8px' }}>Роль</th>
                  <th style={{ padding: '8px' }}>Дія</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>{u.id}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{u.full_name}</td>
                    <td style={{ padding: '8px' }}>{u.email}</td>
                    <td style={{ padding: '8px' }}>
                      <span className="badge" style={{ fontSize: '11px' }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="user">User</option>
                        <option value="merchant">Merchant</option>
                        <option value="admin">Admin 🛡️</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAdminModal(false)}>
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно Кабінету продавця */}
      {showMerchantModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>🏬 Кабінет представника закладу</h3>

            <div style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', pb: '16px' }}>
              <h4>1. Додати новий заклад</h4>
              <form onSubmit={handleCreatePlace}>
                <input className="input-field" type="text" placeholder="Назва закладу (наприклад Піцерія Челентано)" value={placeName} onChange={e => setPlaceName(e.target.value)} required />
                <input className="input-field" type="text" placeholder="Адреса (наприклад вул. Франка, 12)" value={placeAddress} onChange={e => setPlaceAddress(e.target.value)} required />

                <select className="input-field" value={placeRegionId} onChange={e => setPlaceRegionId(e.target.value)} required>
                  <option value="">Оберіть місто...</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>

                <select className="input-field" value={placeCategoryId} onChange={e => setPlaceCategoryId(e.target.value)} required>
                  <option value="">Оберіть категорію закладу...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>

                <button type="submit" className="button" style={{ background: '#10b981' }}>+ Зберегти заклад</button>
              </form>
            </div>

            <div>
              <h4>2. Опублікувати нову акцію</h4>
              {myPlaces.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#ef4444' }}>Спочатку додайте хоча б один заклад вище, щоб опублікувати для нього акцію!</p>
              ) : (
                <form onSubmit={handleCreatePromotion}>
                  <select className="input-field" value={promoPlaceId} onChange={e => setPromoPlaceId(e.target.value)} required>
                    <option value="">Оберіть ваш заклад...</option>
                    {myPlaces.map(p => <option key={p.id} value={p.id}>{p.name} ({p.address})</option>)}
                  </select>

                  <input className="input-field" type="text" placeholder="Заголовок акції (наприклад -30% на велику піцу)" value={promoTitle} onChange={e => setPromoTitle(e.target.value)} required />
                  <input className="input-field" type="text" placeholder="Опис умов" value={promoDesc} onChange={e => setPromoDesc(e.target.value)} />
                  <input className="input-field" type="text" placeholder="Знижка (наприклад -30% або 1+1)" value={promoDiscount} onChange={e => setPromoDiscount(e.target.value)} required />

                  <button type="submit" className="button">🚀 Опублікувати акцію</button>
                </form>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowMerchantModal(false)}>Закрити</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно Авторизації */}
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
                    placeholder="ПІБ або Назва компанії"
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
                    <option value="merchant">Представник закладу (Продавець)</option>
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

      {/* Модальні вікна Категорій та Регіонів */}
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