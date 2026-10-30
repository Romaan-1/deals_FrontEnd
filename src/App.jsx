import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const API_URL = 'http://localhost:5000/api';

// ==========================================
// 1. ШАПКА САЙТУ (HEADER)
// ==========================================
function Header({ user, onLogout, activeRegion, searchQuery, setSearchQuery, onOpenRegionModal, theme, toggleTheme }) {
  const navigate = useNavigate();

  return (
    <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1', margin: 0 }}>Promo</h1>
        </Link>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Пошук акцій, брендів, товарів..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', width: '280px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <button onClick={onOpenRegionModal} style={{ background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
          📍 {activeRegion ? activeRegion.name : 'Усі міста'} ▾
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={toggleTheme}
          style={{
            background: theme === 'dark' ? '#334155' : '#f1f5f9',
            color: theme === 'dark' ? '#f8fafc' : '#334155',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Змінити тему сайту"
        >
          {theme === 'dark' ? '☀️ Світла' : '🌙 Темна'}
        </button>

        {user ? (
          <>
            <button
              onClick={() => navigate('/favorites')}
              style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ❤️ Обране
            </button>

            {user.role === 'admin' && (
              <button onClick={() => navigate('/admin')} style={{ background: '#0f172a', color: '#f8fafc', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                🛡️ Admin
              </button>
            )}
            {(user.role === 'merchant' || user.role === 'admin') && (
              <button onClick={() => navigate('/merchant')} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                🏬 Кабінет
              </button>
            )}
            <span style={{ fontSize: '14px', fontWeight: '600' }}>👤 {user.full_name}</span>
            <button onClick={onLogout} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}>Вийти</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', fontWeight: '600', cursor: 'pointer', marginRight: '4px' }}>Увійти</button>
            <button onClick={() => navigate('/login')} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Реєстрація</button>
          </>
        )}
      </div>
    </header>
  );
}

// ==========================================
// 2. ГОЛОВНА СТОРІНКА (MAIN CATALOG)
// ==========================================
function MainPage({ user, token, activeRegion, searchQuery, showToast }) {
  const [promotions, setPromotions] = useState([]);
  const [popularPlaces, setPopularPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPromoModal, setSelectedPromoModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/categories`).then(res => setCategories(res.data)).catch(() => { });
    axios.get(`${API_URL}/places/popular`).then(res => setPopularPlaces(res.data)).catch(() => { });
  }, []);

  useEffect(() => {
    let url = `${API_URL}/promotions?`;
    if (selectedCategory) url += `category_id=${selectedCategory}&`;
    if (activeRegion) url += `region_id=${activeRegion.id}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

    axios.get(url).then(res => setPromotions(res.data)).catch(() => { });
  }, [selectedCategory, activeRegion, searchQuery]);

  useEffect(() => {
    if (user && token) {
      axios.get(`${API_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const favIds = res.data.map(i => Number(i.promotion_id || i.id));
          setFavorites(favIds);
        })
        .catch(err => console.error('Помилка завантаження обраного:', err));
    }
  }, [user, token]);

  const toggleFavorite = (promoId) => {
    if (!user) {
      showToast('Будь ласка, увійдіть в акаунт, щоб зберігати акції!', 'error');
      return navigate('/login');
    }

    const numericId = Number(promoId);
    const isFav = favorites.includes(numericId);

    if (isFav) {
      axios.delete(`${API_URL}/favorites/${numericId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          setFavorites(prev => prev.filter(id => Number(id) !== numericId));
          showToast('Видалено з обраного', 'success');
        })
        .catch(err => showToast(err.response?.data?.error || 'Помилка видалення з обраного', 'error'));
    } else {
      axios.post(`${API_URL}/favorites`,
        { promotion_id: numericId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then(() => {
          setFavorites(prev => [...prev, numericId]);
          showToast('Додано в обране! ❤️', 'success');
        })
        .catch(err => showToast(err.response?.data?.error || 'Помилка додавання в обране', 'error'));
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: '24px', padding: '40px', color: '#fff', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>
          Усі акції та знижки {activeRegion ? `у м. ${activeRegion.name}` : 'вашого міста'} в одному місці 🔥
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          Заощаджуйте на каві, купонах, техніці та закладах.
        </p>
      </div>

      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Категорії</h3>
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '32px' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{ padding: '12px 20px', borderRadius: '16px', border: 'none', background: selectedCategory === null ? '#6366f1' : '#fff', color: selectedCategory === null ? '#fff' : '#1e293b', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          ✨ Всі
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{ padding: '12px 20px', borderRadius: '16px', border: 'none', background: selectedCategory === cat.id ? '#6366f1' : '#fff', color: selectedCategory === cat.id ? '#fff' : '#1e293b', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>{cat.icon || '🏷️'}</span> {cat.name}
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Популярні заклади</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {popularPlaces.map(place => (
          <div
            key={place.id}
            onClick={() => navigate(`/place/${place.id}`)}
            style={{ background: '#fff', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', overflow: 'hidden' }}>
              {place.logo_url && place.logo_url.startsWith('http') ? (
                <img src={place.logo_url} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{place.logo_url || '🥐'}</span>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{place.name}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>⭐ {place.rating || '4.8'} • {place.active_promos_count || 0} акцій</div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
        {searchQuery ? `Результати пошуку для "${searchQuery}"` : 'Гарячі пропозиції 🔥'}
      </h3>

      {promotions.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '15px' }}>За вашим запитом акцій не знайдено.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '16px' }}>
          {promotions.map(promo => {
            const isFav = favorites.includes(Number(promo.id));

            return (
              <div key={promo.id} className="card" style={{ background: '#fff', borderRadius: '20px', padding: '20px', position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(promo.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: isFav ? '#fef2f2' : '#ffffff',
                    border: isFav ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                  }}
                  title={isFav ? "Видалити з обраного" : "Зберегти в обране"}
                >
                  {isFav ? '❤️' : '🤍'}
                </button>

                <div>
                  <div style={{ height: '110px', background: '#f8fafc', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', marginBottom: '14px', position: 'relative', overflow: 'hidden' }}>
                    {promo.image_url && promo.image_url.startsWith('http') ? (
                      <img src={promo.image_url} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{promo.image_url || '☕🥐'}</span>
                    )}
                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '800' }}>
                      {promo.discount_value || 'Знижка'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                    {promo.title || 'Акційна пропозиція'}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '500' }}>
                    🏬 {promo.place_name || 'Заклад'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                    📍 {promo.address || promo.region_name || 'Адреса закладу'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedPromoModal(promo)}
                    style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    🎁 Забрати
                  </button>
                  <button
                    onClick={() => navigate(`/place/${promo.place_id}`)}
                    style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '10px 14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                    title="Перейти до закладу"
                  >
                    🏬
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🎁 МОДАЛЬНЕ ВІКНО КУПОНА */}
      {selectedPromoModal && (
        <div className="modal-overlay" onClick={() => setSelectedPromoModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', borderRadius: '24px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎁</div>
            <span style={{ background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
              {selectedPromoModal.discount_value}
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '12px', marginBottom: '6px' }}>
              {selectedPromoModal.title}
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              🏬 {selectedPromoModal.place_name} • 📍 {selectedPromoModal.address}
            </p>

            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>
                Ваш персональний купон:
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#4f46e5', letterSpacing: '2px' }}>
                PROMO-{selectedPromoModal.id}2026
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Покажіть цей код на касі закладу
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`PROMO-${selectedPromoModal.id}2026`);
                  showToast('Промокод успішно скопійовано! 📋', 'success');
                }}
                style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                📋 Скопіювати
              </button>
              <button
                onClick={() => setSelectedPromoModal(null)}
                className="btn-secondary"
                style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ marginTop: '60px', background: '#fff', borderTop: '1px solid #e2e8f0', padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontWeight: '800', color: '#6366f1', fontSize: '20px' }}>Promo</div>
          <div>© 2026 Promo. Усі права захищено. Платформа локальних знижок та акцій.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Про нас</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Для бізнесу</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Підтримка</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// 3. СТОРІНКА ЗАКЛАДУ (/place/:id)
// ==========================================
function PlacePage() {
  const { id } = useParams();
  const [placeData, setPlaceData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/places/${id}`)
      .then(res => setPlaceData(res.data))
      .catch(() => { });
  }, [id]);

  if (!placeData) return <div style={{ padding: '40px', textAlign: 'center' }}>Завантаження сторінки закладу...</div>;

  const { place, promotions } = placeData;

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 'bold', cursor: 'pointer', marginBottom: '16px' }}>
        ← На головну
      </button>

      <div style={{ position: 'relative', height: '200px', background: '#334155', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>
        {place.name.toUpperCase()}
        <div style={{ position: 'absolute', bottom: '-24px', left: '32px', width: '80px', height: '80px', borderRadius: '20px', background: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', overflow: 'hidden' }}>
          {place.logo_url && place.logo_url.startsWith('http') ? (
            <img src={place.logo_url} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>{place.logo_url || '🥐'}</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>{place.name}</h2>
          <p style={{ color: '#64748b', marginTop: '4px' }}>⭐ {place.rating || '4.8'} • 📍 {place.address}, {place.region_name}</p>
        </div>
      </div>

      <h3 style={{ marginTop: '32px', marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>Активні акції закладу ({promotions.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {promotions.map(promo => (
          <div key={promo.id} style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{promo.discount_value}</span>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '12px 0 8px 0' }}>{promo.title}</h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>{promo.description}</p>
            <button style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Отримати купон</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. СТОРІНКА АВТОРИЗАЦІЇЗ ВАЛІДАЦІЄЮ
// ==========================================
function AuthPage({ onAuthSuccess, showToast }) {
  const [isRegister, setIsRegister] = useState(true);
  const [accountType, setAccountType] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (val) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setEmailError('Email є обов\'язковим');
    } else if (!emailRegex.test(val)) {
      setEmailError('Введіть коректну e-mail адресу (напр. user@gmail.com)');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (val) => {
    setPassword(val);
    if (!val) {
      setPasswordError('Пароль є обов\'язковим');
    } else if (val.length < 6) {
      setPasswordError('Пароль повинен містити щонайменше 6 символів');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');

    if (emailError || passwordError || !email || !password) {
      setGeneralError('Будь ласка, виправте помилки у формі перед відправкою');
      return;
    }

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const payload = isRegister
      ? { email, password, full_name: fullName, role: accountType }
      : { email, password };

    axios.post(`${API_URL}${endpoint}`, payload)
      .then(res => {
        onAuthSuccess(res.data.user, res.data.token);
        showToast('Успішний вхід у систему!', 'success');
        navigate('/');
      })
      .catch(err => setGeneralError(err.response?.data?.error || 'Помилка авторизації'));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
          {isRegister ? 'Створити акаунт' : 'Вхід у систему'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
          Платформа локальних знижок та акцій
        </p>

        {isRegister && (
          <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
            <button
              type="button"
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: accountType === 'user' ? '#fff' : 'transparent', fontWeight: '600', cursor: 'pointer', boxShadow: accountType === 'user' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setAccountType('user')}
            >
              Користувач
            </button>
            <button
              type="button"
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: accountType === 'merchant' ? '#fff' : 'transparent', fontWeight: '600', cursor: 'pointer', boxShadow: accountType === 'merchant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setAccountType('merchant')}
            >
              Заклад / Бізнес
            </button>
          </div>
        )}

        {generalError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', textAlign: 'center', fontWeight: 'bold' }}>{generalError}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isRegister && (
            <div>
              <input
                className="input-field"
                placeholder={accountType === 'merchant' ? "Назва компанії / закладу" : "ПІБ"}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <input
              className="input-field"
              type="email"
              placeholder="Email (напр. name@domain.com)"
              value={email}
              onChange={e => validateEmail(e.target.value)}
              style={{ borderColor: emailError ? '#ef4444' : '#cbd5e1' }}
              required
            />
            {emailError && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{emailError}</span>}
          </div>

          <div>
            <input
              className="input-field"
              type="password"
              placeholder="Пароль (мін. 6 символів)"
              value={password}
              onChange={e => validatePassword(e.target.value)}
              style={{ borderColor: passwordError ? '#ef4444' : '#cbd5e1' }}
              required
            />
            {passwordError && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{passwordError}</span>}
          </div>

          <button
            type="submit"
            disabled={!!emailError || !!passwordError}
            style={{
              background: (emailError || passwordError) ? '#94a3b8' : '#6366f1',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: (emailError || passwordError) ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {isRegister ? 'Зареєструватися' : 'Увійти'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          {isRegister ? 'Вже є акаунт? ' : 'Немає акаунту? '}
          <span style={{ color: '#6366f1', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => { setIsRegister(!isRegister); setGeneralError(''); }}>
            {isRegister ? 'Увійти' : 'Зареєструватися'}
          </span>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 5. КАБІНЕТ ЗАКЛАДУ (/merchant)
// ==========================================
function MerchantCabinet({ user, token, showToast }) {
  const [activeTab, setActiveTab] = useState('my_promos');
  const [allPromotions, setAllPromotions] = useState([]);
  const [myPlaces, setMyPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);

  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceAddress, setNewPlaceAddress] = useState('');
  const [newPlaceCatId, setNewPlaceCatId] = useState('');
  const [newPlaceRegionId, setNewPlaceRegionId] = useState('');

  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('-20%');

  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageInputType, setImageInputType] = useState('url'); // 'url' або 'file'

  const fetchMyData = () => {
    axios.get(`${API_URL}/places/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setMyPlaces(res.data);
        if (res.data.length > 0) setSelectedPlaceId(res.data[0].id);
      }).catch(() => { });

    axios.get(`${API_URL}/promotions`).then(res => setAllPromotions(res.data)).catch(() => { });
    axios.get(`${API_URL}/categories`).then(res => setCategories(res.data)).catch(() => { });
    axios.get(`${API_URL}/regions`).then(res => setRegions(res.data)).catch(() => { });
  };

  useEffect(() => {
    fetchMyData();
  }, [token]);

  const myPlaceIds = myPlaces.map(p => p.id);
  const myPromotions = allPromotions.filter(p => myPlaceIds.includes(p.place_id));
  const otherPromotions = allPromotions.filter(p => !myPlaceIds.includes(p.place_id));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    axios.post(`${API_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        setLogoUrl(res.data.imageUrl);
        setUploading(false);
        showToast('Фото успішно завантажено!', 'success');
      })
      .catch(() => {
        showToast('Помилка завантаження фото', 'error');
        setUploading(false);
      });
  };

  const handleCreatePlace = (e) => {
    e.preventDefault();
    if (!newPlaceCatId || !newPlaceRegionId) {
      showToast('Будь ласка, оберіть категорію та місто!', 'error');
      return;
    }

    axios.post(`${API_URL}/places`, {
      name: newPlaceName,
      address: newPlaceAddress,
      category_id: parseInt(newPlaceCatId, 10),
      region_id: parseInt(newPlaceRegionId, 10),
      logo_url: logoUrl
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast('Заклад успішно створено!', 'success');
        setNewPlaceName('');
        setNewPlaceAddress('');
        setLogoUrl('');
        setActiveTab('my_promos');
        fetchMyData();
      })
      .catch(err => showToast(err.response?.data?.error || 'Помилка створення закладу', 'error'));
  };

  const handleCreatePromo = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/promotions`, {
      place_id: parseInt(selectedPlaceId, 10),
      title: promoTitle,
      discount_value: promoDiscount,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast('Акцію створено!', 'success');
        setShowAddPromoModal(false);
        setPromoTitle('');
        fetchMyData();
      })
      .catch(err => showToast(err.response?.data?.error || 'Помилка розміщення акції', 'error'));
  };

  const handleDeletePromo = (id) => {
    if (!window.confirm('Видалити цю акцію?')) return;
    axios.delete(`${API_URL}/promotions/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast('Акцію видалено', 'success');
        fetchMyData();
      });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}><span style={{ color: '#6366f1' }}>Promo</span> | Кабінет закладу</h2>
          <div style={{ fontWeight: '600', color: '#475569' }}>👤 {user?.full_name}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', height: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div
              onClick={() => setActiveTab('my_promos')}
              style={{ padding: '12px', borderRadius: '10px', background: activeTab === 'my_promos' ? '#f1f5f9' : 'transparent', fontWeight: '600', color: activeTab === 'my_promos' ? '#6366f1' : '#475569', cursor: 'pointer', marginBottom: '6px' }}
            >
              🔥 Мої акції ({myPromotions.length})
            </div>
            <div
              onClick={() => setActiveTab('other_promos')}
              style={{ padding: '12px', borderRadius: '10px', background: activeTab === 'other_promos' ? '#f1f5f9' : 'transparent', fontWeight: '600', color: activeTab === 'other_promos' ? '#6366f1' : '#475569', cursor: 'pointer', marginBottom: '6px' }}
            >
              📊 Акції конкурентів ({otherPromotions.length})
            </div>
            <div
              onClick={() => setActiveTab('add_place')}
              style={{ padding: '12px', borderRadius: '10px', background: activeTab === 'add_place' ? '#f1f5f9' : 'transparent', fontWeight: '600', color: activeTab === 'add_place' ? '#6366f1' : '#475569', cursor: 'pointer' }}
            >
              🏬 Додати новий заклад
            </div>
          </div>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#64748b', fontSize: '13px' }}>Моїх закладів</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{myPlaces.length}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#64748b', fontSize: '13px' }}>Активних акцій бізнесу</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{myPromotions.length}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#64748b', fontSize: '13px' }}>Загалом у місті</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{allPromotions.length} 🏷️</div>
              </div>
            </div>

            {activeTab === 'my_promos' && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Акції моїх закладів</h3>
                  {myPlaces.length > 0 ? (
                    <button onClick={() => setShowAddPromoModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                      + Додати нову акцію
                    </button>
                  ) : (
                    <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>Спочатку додайте ваш заклад у вкладці меню!</p>
                  )}
                </div>

                {myPromotions.length === 0 ? (
                  <p style={{ color: '#64748b' }}>У вас поки немає опублікованих акцій.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '12px' }}>Заголовок</th>
                        <th style={{ padding: '12px' }}>Заклад</th>
                        <th style={{ padding: '12px' }}>Знижка</th>
                        <th style={{ padding: '12px' }}>Дії</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPromotions.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px 12px', fontWeight: '600' }}>{p.title}</td>
                          <td style={{ padding: '16px 12px', color: '#64748b' }}>{p.place_name}</td>
                          <td style={{ padding: '16px 12px', color: '#ef4444', fontWeight: 'bold' }}>{p.discount_value}</td>
                          <td style={{ padding: '16px 12px' }}>
                            <button onClick={() => handleDeletePromo(p.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Видалити</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'other_promos' && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Аналітика акцій інших закладів на ринку</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '12px' }}>Назва акції</th>
                      <th style={{ padding: '12px' }}>Заклад</th>
                      <th style={{ padding: '12px' }}>Розмір знижки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherPromotions.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 12px', fontWeight: '600' }}>{p.title}</td>
                        <td style={{ padding: '14px 12px', color: '#6366f1', fontWeight: '500' }}>🏬 {p.place_name}</td>
                        <td style={{ padding: '14px 12px', color: '#ef4444', fontWeight: 'bold' }}>{p.discount_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'add_place' && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Реєстрація нового закладу</h3>

                <form onSubmit={handleCreatePlace} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '450px' }}>
                  <input
                    className="input-field"
                    placeholder="Назва закладу..."
                    value={newPlaceName}
                    onChange={e => setNewPlaceName(e.target.value)}
                    required
                  />
                  <input
                    className="input-field"
                    placeholder="Адреса..."
                    value={newPlaceAddress}
                    onChange={e => setNewPlaceAddress(e.target.value)}
                    required
                  />

                  {/* 🖼️ БЛОК ВИБОРУ ФОТО: URL АБО ЗАВАНТАЖЕННЯ ФАЙЛУ */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Логотип / Фото закладу:</label>

                    {/* Перемикач режимів */}
                    <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '3px', borderRadius: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setImageInputType('url')}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '8px',
                          background: imageInputType === 'url' ? '#fff' : 'transparent',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🔗 Посилання з інтернету
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputType('file')}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '8px',
                          background: imageInputType === 'file' ? '#fff' : 'transparent',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        📁 Завантажити файл
                      </button>
                    </div>

                    {/* Режим 1: Вставка URL з інтернету */}
                    {imageInputType === 'url' ? (
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://example.com/photo.jpg"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        style={{ marginBottom: 0 }}
                      />
                    ) : (
                      /* Режим 2: Завантаження файлу з ПК */
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          style={{ fontSize: '13px' }}
                        />
                        {uploading && <span style={{ fontSize: '12px', color: '#6366f1', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>⏳ Завантаження фото...</span>}
                      </div>
                    )}

                    {/* Live Preview для обох варіантів */}
                    {logoUrl && (
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                        <img
                          src={logoUrl}
                          alt="Preview"
                          style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/50?text=Error'; }}
                        />
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>✅ Зображення підтягнуто!</span>
                      </div>
                    )}
                  </div>

                  <select className="input-field" value={newPlaceCatId} onChange={e => setNewPlaceCatId(e.target.value)} required>
                    <option value="">Оберіть категорію...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>

                  <select className="input-field" value={newPlaceRegionId} onChange={e => setNewPlaceRegionId(e.target.value)} required>
                    <option value="">Оберіть місто...</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>

                  <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Зберегти новий заклад
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddPromoModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Опублікувати акцію</h3>
            <form onSubmit={handleCreatePromo}>
              <select className="input-field" value={selectedPlaceId} onChange={e => setSelectedPlaceId(e.target.value)} required>
                {myPlaces.map(p => <option key={p.id} value={p.id}>{p.name} ({p.address})</option>)}
              </select>
              <input className="input-field" placeholder="Заголовок (наприклад -30% на велику піцу)" value={promoTitle} onChange={e => setPromoTitle(e.target.value)} required />
              <input className="input-field" placeholder="Розмір знижки (наприклад -30% або 1+1)" value={promoDiscount} onChange={e => setPromoDiscount(e.target.value)} required />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddPromoModal(false)}>Скасувати</button>
                <button type="submit" className="button" style={{ width: 'auto' }}>Опублікувати</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. СТОРІНКА ОБРАНОГО (/favorites)
// ==========================================
function FavoritesPage({ token, user, showToast }) {
  const [favoritePromos, setFavoritePromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setFavoritePromos(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [token]);

  const removeFavorite = (promoId) => {
    axios.delete(`${API_URL}/favorites/${promoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setFavoritePromos(favoritePromos.filter(p => Number(p.id || p.promotion_id) !== Number(promoId)));
        showToast('Видалено з обраного', 'success');
      });
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 'bold', cursor: 'pointer', marginBottom: '16px' }}>
        ← На головну
      </button>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        ❤️ Ваші збережені акції ({favoritePromos.length})
      </h2>

      {loading ? (
        <p>Завантаження...</p>
      ) : favoritePromos.length === 0 ? (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '16px' }}>Ви ще не додали жодної акції в обране 💔</p>
          <button onClick={() => navigate('/')} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Перейти до каталогу
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {favoritePromos.map(promo => {
            const pId = promo.promotion_id || promo.id;
            return (
              <div key={pId} className="card" style={{ background: '#fff', borderRadius: '20px', padding: '20px', position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(pId);
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                  title="Видалити з обраного"
                >
                  ❤️
                </button>

                <div style={{ height: '120px', background: '#f8fafc', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                  {promo.image_url && promo.image_url.startsWith('http') ? (
                    <img src={promo.image_url} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{promo.image_url || '☕🥐'}</span>
                  )}
                  <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    {promo.discount_value || '-20%'}
                  </span>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>{promo.title}</h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>🏬 {promo.place_name || 'Заклад'}</p>

                <button onClick={() => navigate(`/place/${promo.place_id}`)} style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Детальніше
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. АДМІН-ПАНЕЛЬ (/admin)
// ==========================================
function AdminPanel({ token, showToast }) {
  const [activeTab, setActiveTab] = useState('places');
  const [pendingPlaces, setPendingPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const loadData = () => {
    axios.get(`${API_URL}/admin/places/pending`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPendingPlaces(res.data)).catch(() => { });

    axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data)).catch(() => { });

    axios.get(`${API_URL}/promotions`)
      .then(res => setPromotions(res.data)).catch(() => { });
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleApprovePlace = (id, isApproved) => {
    axios.put(`${API_URL}/admin/places/${id}/approve`, { is_verified: isApproved }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast(isApproved ? 'Заклад успішно підтверджено!' : 'Запит відхилено', 'success');
        loadData();
      });
  };

  const handleChangeRole = (userId, newRole) => {
    axios.put(`${API_URL}/admin/users/${userId}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast('Роль успішно змінено!', 'success');
        loadData();
      });
  };

  const handleDeletePromo = (promoId) => {
    if (!window.confirm('Видалити цю акцію як адміністратор?')) return;
    axios.delete(`${API_URL}/promotions/${promoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast('Акцію видалено', 'success');
        loadData();
      });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}><span style={{ color: '#818cf8' }}>Promo</span> | Admin Panel</h2>
          <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>SuperAdmin 🛡️</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '16px', height: 'fit-content' }}>
            <div
              onClick={() => setActiveTab('places')}
              style={{ padding: '12px', borderRadius: '10px', background: activeTab === 'places' ? '#334155' : 'transparent', fontWeight: '600', color: '#fff', cursor: 'pointer', marginBottom: '6px' }}
            >
              Запити закладів ({pendingPlaces.length})
            </div>
            <div
              onClick={() => setActiveTab('users')}
              style={{ padding: '12px', borderRadius: '10px', background: activeTab === 'users' ? '#334155' : 'transparent', fontWeight: '600', color: '#fff', cursor: 'pointer', marginBottom: '6px' }}
            >
              Користувачі ({users.length})
            </div>
            <div
              onClick={() => setActiveTab('promos')}
              style={{ padding: '12px', borderRadius: '10px', background: activeTab === 'promos' ? '#334155' : 'transparent', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
            >
              Модерація акцій ({promotions.length})
            </div>
          </div>

          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px' }}>
            {activeTab === 'places' && (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Запити на підтвердження закладів</h3>
                {pendingPlaces.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>Немає нових запитів на модерацію.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '12px' }}>Заклад</th>
                        <th style={{ padding: '12px' }}>Деталі</th>
                        <th style={{ padding: '12px' }}>Рішення</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPlaces.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{p.name}</td>
                          <td style={{ padding: '16px 12px', color: '#cbd5e1' }}>{p.category_name} • {p.region_name}</td>
                          <td style={{ padding: '16px 12px', display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleApprovePlace(p.id, true)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Прийняти</button>
                            <button onClick={() => handleApprovePlace(p.id, false)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Відхилити</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {activeTab === 'users' && (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Управління користувачами</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '12px' }}>Користувач</th>
                      <th style={{ padding: '12px' }}>Email</th>
                      <th style={{ padding: '12px' }}>Змінити роль</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 'bold' }}>{u.full_name}</td>
                        <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>{u.email}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
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
              </>
            )}

            {activeTab === 'promos' && (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Модерація акцій платформи</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '12px' }}>Назва акції</th>
                      <th style={{ padding: '12px' }}>Заклад</th>
                      <th style={{ padding: '12px' }}>Знижка</th>
                      <th style={{ padding: '12px' }}>Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 'bold' }}>{p.title}</td>
                        <td style={{ padding: '14px 12px', color: '#818cf8' }}>{p.place_name}</td>
                        <td style={{ padding: '14px 12px', color: '#f87171', fontWeight: 'bold' }}>{p.discount_value}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <button onClick={() => handleDeletePromo(p.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            🗑️ Видалити
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. ГОЛОВНИЙ КОМПОНЕНТ APP
// ==========================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  const [regions, setRegions] = useState([]);
  const [activeRegion, setActiveRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegionModal, setShowRegionModal] = useState(false);

  const [citySearchFilter, setCitySearchFilter] = useState('');
  const [customCityName, setCustomCityName] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const fetchRegions = () => {
    axios.get(`${API_URL}/regions`)
      .then(res => setRegions(res.data))
      .catch(() => { });
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showToast('Ви вийшли з акаунту', 'success');
  };

  const handleAddCity = (nameToAdd) => {
    const finalName = nameToAdd || customCityName || citySearchFilter;

    if (!finalName || !finalName.trim()) return;

    axios.post(`${API_URL}/regions`, { name: finalName.trim() })
      .then(res => {
        showToast(`Місто "${res.data.name}" успішно додано!`, 'success');
        setActiveRegion(res.data);
        setCustomCityName('');
        setCitySearchFilter('');
        setShowRegionModal(false);
        fetchRegions();
      })
      .catch(err => showToast(err.response?.data?.error || 'Помилка додавання міста', 'error'));
  };

  const filteredRegions = regions.filter(r =>
    r.name.toLowerCase().includes(citySearchFilter.toLowerCase())
  );

  return (
    <BrowserRouter>
      <Header
        user={currentUser}
        onLogout={handleLogout}
        activeRegion={activeRegion}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenRegionModal={() => setShowRegionModal(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <Routes>
        <Route path="/" element={<MainPage user={currentUser} token={token} activeRegion={activeRegion} searchQuery={searchQuery} showToast={showToast} />} />
        <Route path="/place/:id" element={<PlacePage />} />
        <Route path="/login" element={<AuthPage onAuthSuccess={handleAuthSuccess} showToast={showToast} />} />
        <Route
          path="/merchant"
          element={currentUser?.role === 'merchant' || currentUser?.role === 'admin' ? <MerchantCabinet user={currentUser} token={token} showToast={showToast} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={currentUser?.role === 'admin' ? <AdminPanel token={token} showToast={showToast} /> : <Navigate to="/" />}
        />
        <Route path="/favorites" element={<FavoritesPage token={token} user={currentUser} showToast={showToast} />} />
      </Routes>

      {/* 📍 МОДАЛЬНЕ ВІКНО ВИБОРУ МІСТА */}
      {showRegionModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>Оберіть місто</h3>

            <input
              type="text"
              placeholder="🔍 Введіть назву міста..."
              value={citySearchFilter}
              onChange={(e) => setCitySearchFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredRegions.length === 0 && citySearchFilter.trim()) {
                    handleAddCity(citySearchFilter);
                  }
                }
              }}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '14px', outline: 'none', fontSize: '14px' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
              <button
                onClick={() => { setActiveRegion(null); setShowRegionModal(false); }}
                style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', background: activeRegion === null ? '#6366f1' : '#f1f5f9', color: activeRegion === null ? '#fff' : '#1e293b', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
              >
                🌍 Усі міста України
              </button>

              {filteredRegions.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setActiveRegion(r); setShowRegionModal(false); }}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', background: activeRegion?.id === r.id ? '#6366f1' : '#f1f5f9', color: activeRegion?.id === r.id ? '#fff' : '#1e293b', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}
                >
                  📍 {r.name}
                </button>
              ))}

              {filteredRegions.length === 0 && citySearchFilter.trim() !== '' && (
                <button
                  onClick={() => handleAddCity(citySearchFilter)}
                  style={{ padding: '12px', borderRadius: '10px', border: '2px dashed #10b981', background: '#ecfdf5', color: '#047857', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
                >
                  ➕ Натисніть сюди або Enter, щоб додати "{citySearchFilter}"
                </button>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddCity(customCityName); }} style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Додати нове місто..."
                value={customCityName}
                onChange={(e) => setCustomCityName(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              />
              <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                + Додати
              </button>
            </form>

            <button className="btn-secondary" onClick={() => setShowRegionModal(false)} style={{ width: '100%', padding: '10px', borderRadius: '10px' }}>
              Закрити
            </button>
          </div>
        </div>
      )}

      {/* 🔔 FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff',
          padding: '14px 20px',
          borderRadius: '14px',
          fontWeight: 'bold',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          {toast.message}
        </div>
      )}
    </BrowserRouter>
  );
}