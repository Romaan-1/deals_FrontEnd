import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const API_URL = 'http://localhost:5000/api';

// ==========================================
// ЛОГОТИП САЙТУ
// ==========================================
function PromoLogo({ size = 34, fontSize = '22px' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="promoLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="10" fill="url(#promoLogoGrad)" />
        <path
          d="M10.5 17.8V11.5C10.5 10.9477 10.9477 10.5 11.5 10.5H17.8C18.0652 10.5 18.3196 10.6054 18.5071 10.7929L25.2929 17.5787C25.8787 18.1645 25.8787 19.1142 25.2929 19.7L19.7 25.2929C19.1142 25.8787 18.1645 25.8787 17.5787 25.2929L10.7929 18.5071C10.6054 18.3196 10.5 18.0652 10.5 17.8Z"
          fill="#ffffff"
        />
        <circle cx="14.5" cy="14.5" r="1.6" fill="#4f46e5" />
        <circle cx="26.5" cy="9.5" r="2.5" fill="#fbbf24" />
      </svg>
    </div>
  );
}

// ==========================================
// 1. ШАПКА САЙТУ (HEADER)
// ==========================================
function Header({
  searchQuery,
  setSearchQuery,
  selectedRegionName,
  selectedRegion,
  activeRegion,
  onOpenRegionModal,
  setShowRegionModal,
  theme,
  darkMode,
  toggleTheme,
  setTheme,
  user,
  onLogout
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [pressedBtn, setPressedBtn] = useState(null);

  const triggerClickFeedback = (btnKey, action) => {
    setPressedBtn(btnKey);
    setTimeout(() => setPressedBtn(null), 220);
    if (action) action();
  };

  const isActivePath = (path) => location.pathname === path;

  // Універсальне визначення вибраного міста
  const regionLabel =
    selectedRegionName ||
    (typeof selectedRegion === 'object' ? selectedRegion?.name : selectedRegion) ||
    (typeof activeRegion === 'object' ? activeRegion?.name : activeRegion) ||
    'Усі міста';

  const handleOpenRegions = () => {
    if (onOpenRegionModal) onOpenRegionModal();
    else if (setShowRegionModal) setShowRegionModal(true);
  };

  // Універсальне визначення теми
  const isDark = theme ? theme === 'dark' : Boolean(darkMode);
  const handleToggleTheme = () => {
    if (toggleTheme) toggleTheme();
    else if (setTheme) setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <Link
            to="/"
            className="logo-link"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0
            }}
          >
            <PromoLogo />
          </Link>

          <input
            type="text"
            className="header-search"
            placeholder="Пошук акцій, брендів, товарів..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />

          <button
            type="button"
            className={`nav-pill-btn ${regionLabel && regionLabel !== 'Усі міста' ? 'active' : ''
              }`}
            onClick={handleOpenRegions}
          >
            {regionLabel} ▾
          </button>
        </div>

        <div className="header-right">
          <button
            type="button"
            className={`nav-pill-btn ${pressedBtn === 'theme' ? 'active' : ''}`}
            onClick={() => triggerClickFeedback('theme', handleToggleTheme)}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <Link
                to="/favorites"
                className={`nav-pill-btn ${isActivePath('/favorites') ? 'active' : ''}`}
              >
                Обране
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`nav-pill-btn ${isActivePath('/admin') ? 'active' : ''}`}
                >
                  Admin
                </Link>
              )}

              {(user.role === 'merchant' || user.role === 'admin') && (
                <Link
                  to="/merchant"
                  className={`nav-pill-btn ${isActivePath('/merchant') ? 'active' : ''}`}
                >
                  Кабінет
                </Link>
              )}

              <span className="nav-user-name">{user.full_name || user.email}</span>

              <button
                type="button"
                className={`nav-pill-btn ${pressedBtn === 'logout' ? 'active' : ''}`}
                onClick={() =>
                  triggerClickFeedback('logout', () => {
                    if (onLogout) onLogout();
                    navigate('/');
                  })
                }
              >
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-pill-btn ${isActivePath('/login') ? 'active' : ''}`}
              >
                Увійти
              </Link>
              <Link
                to="/register"
                className={`nav-pill-btn ${isActivePath('/register') ? 'active' : ''}`}
              >
                Реєстрація
              </Link>
            </>
          )}
        </div>
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
    const params = new URLSearchParams();
    if (selectedCategory !== null) params.append('category_id', selectedCategory);
    if (activeRegion) params.append('region_id', activeRegion.id);
    if (searchQuery && searchQuery.trim() !== '') params.append('search', searchQuery.trim());

    const queryString = params.toString();
    const url = queryString ? `${API_URL}/promotions?${queryString}` : `${API_URL}/promotions`;

    axios.get(url)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        if (selectedCategory !== null) {
          setPromotions(data.filter(p => !p.category_id || Number(p.category_id) === Number(selectedCategory)));
        } else {
          setPromotions(data);
        }
      })
      .catch(err => {
        console.error('Помилка фільтрації акцій:', err);
        setPromotions([]);
      });
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

      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '14px' }}>Категорії</h3>
      <div
        className="categories-scroll"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className="category-chip"
          style={{
            background: selectedCategory === null ? '#6366f1' : '#fff',
            color: selectedCategory === null ? '#fff' : '#1e293b',
            borderColor: selectedCategory === null ? '#6366f1' : '#e2e8f0',
            boxShadow: selectedCategory === null ? '0 4px 12px rgba(99, 102, 241, 0.25)' : '0 1px 2px rgba(0,0,0,0.04)'
          }}
        >
          ✨ Всі
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className="category-chip"
            style={{
              background: selectedCategory === cat.id ? '#6366f1' : '#fff',
              color: selectedCategory === cat.id ? '#fff' : '#1e293b',
              borderColor: selectedCategory === cat.id ? '#6366f1' : '#e2e8f0',
              boxShadow: selectedCategory === cat.id ? '0 4px 12px rgba(99, 102, 241, 0.25)' : '0 1px 2px rgba(0,0,0,0.04)'
            }}
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
              {place.logo_url && (place.logo_url.startsWith('http') || place.logo_url.startsWith('/uploads')) ? (
                <img
                  src={place.logo_url.startsWith('/uploads') ? `http://localhost:5000${place.logo_url}` : place.logo_url}
                  alt={place.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
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
        <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '12px' }}>
            У цій категорії або за вашим запитом акцій поки не знайдено.
          </p>
          {selectedCategory !== null && (
            <button
              onClick={() => setSelectedCategory(null)}
              style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              ✨ Показати всі акції
            </button>
          )}
        </div>
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
                    {promo.image_url && (promo.image_url.startsWith('http') || promo.image_url.startsWith('/uploads')) ? (
                      <img
                        src={promo.image_url.startsWith('/uploads') ? `http://localhost:5000${promo.image_url}` : promo.image_url}
                        alt={promo.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
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
                    onClick={() => {
                      if (promo.link_url && promo.link_url.trim()) {
                        // Форматуємо URL (якщо ввели без https://)
                        const targetUrl = promo.link_url.startsWith('http')
                          ? promo.link_url
                          : `https://${promo.link_url}`;

                        window.open(targetUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        // Якщо посилання не заповнили, переводимо на сторінку закладу
                        navigate(`/place/${promo.place_id}`);
                      }
                    }}
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

      {/* */}
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


    </div>
  );
}

// ==========================================
// 3. СТОРІНКА ЗАКЛАДУ (/place/:id)
// ==========================================
function PlacePage({ token, user, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [placeData, setPlaceData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isImageUrl = (url) => typeof url === 'string' && (url.startsWith('http') || url.startsWith('/uploads'));

  // 🔄 Завантаження інформації про заклад та його відгуків
  const fetchPlaceDetails = () => {
    axios.get(`${API_URL}/places/${id}`)
      .then(res => setPlaceData(res.data))
      .catch(() => { });

    axios.get(`${API_URL}/places/${id}/reviews`)
      .then(res => setReviews(res.data))
      .catch(() => { });
  };

  useEffect(() => {
    fetchPlaceDetails();
  }, [id]);


  // 📝 Відправка нового відгуку
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!token) {
      if (showToast) showToast('Будь ласка, увійдіть в акаунт, щоб залишити відгук', 'error');
      return navigate('/login');
    }

    setSubmitting(true);
    axios.post(
      `${API_URL}/places/${id}/reviews`,
      { rating: Number(rating), comment },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        if (showToast) showToast('Дякуємо! Ваш відгук успішно додано.', 'success');
        setComment('');
        fetchPlaceDetails(); // Оновлюємо список відгуків та середній рейтинг закладу
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || 'Помилка при збереженні відгуку';
        if (showToast) showToast(errorMsg, 'error');
      })
      .finally(() => setSubmitting(false));
  };

  // 🗑️ Видалення відгуку
  const handleDeleteReview = (reviewId) => {
    if (!window.confirm('Видалити цей відгук?')) return;

    axios.delete(`${API_URL}/reviews/${reviewId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        if (showToast) showToast('Відгук видалено', 'success');
        fetchPlaceDetails(); // Оновлюємо список коментарів і рейтинг закладу
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || 'Помилка при видаленні відгуку';
        if (showToast) showToast(errorMsg, 'error');
      });
  };

  if (!placeData) return <div style={{ padding: '40px', textAlign: 'center' }}>Завантаження сторінки закладу...</div>;

  const { place, promotions } = placeData;

  if (!place) return <div style={{ padding: '40px', textAlign: 'center' }}>Завантаження...</div>;

  const isImg =
    typeof place.logo_url === 'string' &&
    (place.logo_url.startsWith('http') || place.logo_url.startsWith('/uploads'));

  const fullImgUrl =
    isImg && place.logo_url.startsWith('/uploads')
      ? `http://localhost:5000${place.logo_url}`
      : place.logo_url;

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 'bold', cursor: 'pointer', marginBottom: '16px' }}>
        ← На головну
      </button>

      {/* Верхній банер закладу (фото на фоні або темна плашка) */}
      <div
        style={{
          height: '220px',
          borderRadius: '24px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: isImg
            ? `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.75)), url("${fullImgUrl}") center/cover no-repeat`
            : '#334155'
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: '800',
            letterSpacing: '1px',
            textAlign: 'center',
            padding: '0 16px'
          }}
        >
          {place.name.toUpperCase()}
        </h1>
      </div>

      {/* Квадратний логотип зліва знизу */}
      <div
        style={{
          width: '84px',
          height: '84px',
          borderRadius: '20px',
          backgroundColor: 'var(--bg-surface)',
          border: '3px solid var(--bg-page)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          fontSize: '36px',
          marginTop: '-42px',
          marginLeft: '28px',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        {isImg ? (
          <img
            src={fullImgUrl}
            alt={place.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          place.logo_url || '🏢'
        )}
      </div>

      {/* Назва, рейтинг та адреса */}
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>{place.name}</h2>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            ⭐ <strong style={{ color: '#1e293b' }}>{place.rating || '4.8'}</strong> ({reviews.length} відгуків) • 📍 {place.address}, {place.region_name}
          </p>
        </div>
      </div>

      {/* Список активних акцій */}
      <h3 style={{ marginTop: '32px', marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
        🔥 Активні акції закладу ({promotions.length})
      </h3>

      {promotions.length === 0 ? (
        <p style={{ color: '#64748b' }}>Наразі у цього закладу немає активних акцій.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {promotions.map(promo => (

            <div key={promo.id} style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Фото акції (якщо є URL або завантажений файл) */}
              {typeof promo.image_url === 'string' &&
                (promo.image_url.startsWith('http') || promo.image_url.startsWith('/uploads')) && (
                  <div
                    style={{
                      height: '150px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      marginBottom: '14px',
                      backgroundColor: 'var(--bg-page)'
                    }}
                  >
                    <img
                      src={
                        promo.image_url.startsWith('/uploads')
                          ? `http://localhost:5000${promo.image_url}`
                          : promo.image_url
                      }
                      alt={promo.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              <span style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                {promo.discount_value}
              </span>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '12px 0 8px 0' }}>{promo.title}</h4>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>{promo.description}</p>
              {promo.link_url && (
                <a href={promo.link_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#6366f1', color: '#fff', padding: '8px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
                  🎁 Отримати знижку
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ⭐️ РОЗДІЛ ВІДГУКІВ ТА ОЦІНОК */}
      <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px' }}>
          💬 Відгуки відвідувачів ({reviews.length})
        </h3>

        {/* Форма публікації відгуку */}
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
            {user ? 'Залишити свій відгук' : 'Увійдіть, щоб залишити відгук'}
          </h4>

          {user ? (
            <form onSubmit={handleAddReview}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>
                  Ваша оцінка:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        filter: star <= rating ? 'none' : 'grayscale(100%) opacity(30%)',
                        transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.1s'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                  <span style={{ alignSelf: 'center', fontWeight: 'bold', marginLeft: '8px', color: '#6366f1' }}>
                    {rating} / 5
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <textarea
                  placeholder="Поділіться враженнями про заклад або акцію..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  required
                  style={{ width: '100%', padding: '12px 5px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {submitting ? 'Опублікування...' : 'Опублікувати відгук'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔐 Увійти для написання відгуку
            </button>
          )}
        </div>

        {/* Список відгуків */}
        {reviews.length === 0 ? (
          <p style={{ color: '#64748b' }}>Будьте першим, хто залишить відгук про цей заклад!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map(r => {
              const isOwnReview = user && Number(user.id) === Number(r.user_id);
              const canDelete = user && (user.role === 'admin' || isOwnReview);

              return (
                <div key={r.id} style={{ background: '#fff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{r.full_name}</span>
                      {isOwnReview && (
                        <span style={{ fontSize: '11px', background: '#eef2ff', color: '#6366f1', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          Ваш відгук
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(r.id)}
                          style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          title={user.role === 'admin' && !isOwnReview ? 'Видалити як адміністратор' : 'Видалити свій відгук'}
                        >
                          🗑️ Видалити
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ color: '#fbbf24', fontSize: '14px', marginBottom: '6px' }}>
                    {'⭐'.repeat(r.rating)} <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>({r.rating}/5)</span>
                  </div>
                  <p style={{ color: '#334155', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                    {r.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. СТОРІНКА АВТОРИЗАЦІЇЗ ВАЛІДАЦІЄЮ
// ==========================================
function AuthPage({ initialMode = 'login', onLogin, setUser }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Автоматично перемикаємо режим, якщо перейшли за URL (/login або /register)
  useEffect(() => {
    if (location.pathname === '/register' || location.pathname === '/signup') {
      setIsLogin(false);
    } else if (location.pathname === '/login') {
      setIsLogin(true);
    }
  }, [location.pathname]);

  const handleAuthSuccess = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (onLogin) onLogin(userData);
    if (setUser) setUser(userData);
    navigate(userData.role === 'merchant' ? '/merchant' : '/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          email,
          password
        });
        handleAuthSuccess(res.data.token, res.data.user);
      } else {
        await axios.post('http://localhost:5000/api/auth/register', {
          full_name: fullName,
          email,
          password,
          role
        });

        // Одразу входимо після успішної реєстрації
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
          email,
          password
        });
        handleAuthSuccess(loginRes.data.token, loginRes.data.user);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (isLogin
          ? 'Невірний email або пароль'
          : 'Помилка реєстрації. Можливо, ця пошта вже використовується.')
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (targetLogin) => {
    setError('');
    setIsLogin(targetLogin);
    navigate(targetLogin ? '/login' : '/register');
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 150px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}
    >
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.14)'
        }}
      >
        <h2 style={{ fontSize: '26px', fontWeight: '800', textAlign: 'center', marginBottom: '6px' }}>
          {isLogin ? 'Вхід у систему' : 'Реєстрація'}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginBottom: '26px'
          }}
        >
          Платформа локальних знижок та акцій
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Ім'я або назва закладу"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          )}

          <input
            type="email"
            placeholder="Електронна пошта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%' }}
          />

          {!isLogin && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value="user">Я покупець (шукаю акції)</option>
              <option value="merchant">Я бізнес / заклад (хочу додавати акції)</option>
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '14px',
              fontSize: '15px',
              marginTop: '6px'
            }}
          >
            {loading ? 'Зачекайте...' : isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--text-muted)'
          }}
        >
          {isLogin ? 'Немає акаунту? ' : 'Вже маєте акаунт? '}
          <button
            type="button"
            onClick={() => switchMode(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#6366f1',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {isLogin ? 'Зареєструватися' : 'Увійти'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 5. КАБІНЕТ ЗАКЛАДУ (/merchant)
// ==========================================
function MerchantCabinet({ user: propUser, regions: propRegions, categories: propCategories }) {
  const user = propUser || JSON.parse(localStorage.getItem('user') || 'null');

  const [activeTab, setActiveTab] = useState('stats');
  const [regions, setRegions] = useState(propRegions || []);
  const [categories, setCategories] = useState(propCategories || []);
  const [myPlaces, setMyPlaces] = useState([]);
  const [myPromotions, setMyPromotions] = useState([]);
  const [allPromotions, setAllPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [placeForm, setPlaceForm] = useState({
    name: '',
    address: '',
    region_id: '',
    category_id: '',
    logo_url: ''
  });

  const [promoForm, setPromoForm] = useState({
    place_id: '',
    title: '',
    description: '',
    discount_value: '',
    image_url: '',
    link_url: ''
  });

  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      const [placesRes, promosRes, regionsRes, categoriesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/places/my', authHeaders),
        axios.get('http://localhost:5000/api/promotions'),
        axios.get('http://localhost:5000/api/regions'),
        axios.get('http://localhost:5000/api/categories')
      ]);

      const placesList = placesRes.data || [];
      const promosList = promosRes.data || [];
      const regionsList = regionsRes.data || [];
      const categoriesList = categoriesRes.data || [];

      setMyPlaces(placesList);
      setAllPromotions(promosList);
      setRegions(regionsList);
      setCategories(categoriesList);

      const myPlaceIds = new Set(placesList.map((p) => Number(p.id)));
      setMyPromotions(promosList.filter((pr) => myPlaceIds.has(Number(pr.place_id))));

      setPlaceForm((prev) => ({
        ...prev,
        region_id: prev.region_id || regionsList[0]?.id || '',
        category_id: prev.category_id || categoriesList[0]?.id || ''
      }));

      if (placesList.length > 0) {
        setPromoForm((prev) => ({ ...prev, place_id: prev.place_id || placesList[0].id }));
      }
    } catch (err) {
      console.error('Помилка завантаження кабінету:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  // Завантаження фото на сервер (/api/upload)
  const handleFileUpload = async (file, targetField) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setUploading(true);
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (targetField === 'place') {
        setPlaceForm((prev) => ({ ...prev, logo_url: res.data.url }));
      } else {
        setPromoForm((prev) => ({ ...prev, image_url: res.data.url }));
      }
    } catch (err) {
      alert('Помилка завантаження зображення');
    } finally {
      setUploading(false);
    }
  };

  // Створення закладу
  const handleCreatePlace = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/places',
        {
          ...placeForm,
          region_id: Number(placeForm.region_id || regions[0]?.id),
          category_id: Number(placeForm.category_id || categories[0]?.id)
        },
        authHeaders
      );
      setPlaceForm({
        name: '',
        address: '',
        region_id: regions[0]?.id || '',
        category_id: categories[0]?.id || '',
        logo_url: ''
      });
      await fetchMerchantData();
      setActiveTab('places');
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка створення закладу');
    }
  };

  // Створення акції
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoForm.place_id) {
      alert('Спочатку створіть заклад!');
      return;
    }
    try {
      await axios.post(
        'http://localhost:5000/api/promotions',
        {
          ...promoForm,
          place_id: Number(promoForm.place_id)
        },
        authHeaders
      );
      setPromoForm({
        place_id: myPlaces[0]?.id || '',
        title: '',
        description: '',
        discount_value: '',
        image_url: '',
        link_url: ''
      });
      await fetchMerchantData();
      setActiveTab('promos');
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка створення акції');
    }
  };

  // Видалення акції
  const handleDeletePromo = async (promoId) => {
    if (!window.confirm('Видалити цю акцію?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/promotions/${promoId}`, authHeaders);
      fetchMerchantData();
    } catch (err) {
      alert('Не вдалося видалити акцію');
    }
  };

  const verifiedCount = myPlaces.filter((p) => p.is_verified).length;
  const pendingCount = myPlaces.length - verifiedCount;
  const competitorPromosCount = Math.max(0, allPromotions.length - myPromotions.length);

  const renderPreviewImg = (url, fallbackEmoji) => {
    if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/uploads'))) {
      const src = url.startsWith('/uploads') ? `http://localhost:5000${url}` : url;
      return (
        <img
          src={src}
          alt="preview"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      );
    }
    return <span>{url || fallbackEmoji}</span>;
  };

  const menuItems = [
    { key: 'stats', label: 'Статистика' },
    { key: 'places', label: `Мої заклади (${myPlaces.length})` },
    { key: 'add-place', label: '+ Додати заклад' },
    { key: 'promos', label: `Мої акції (${myPromotions.length})` },
    { key: 'add-promo', label: '+ Додати акцію' }
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 24px 60px' }}>
      {/* Верхній рядок панелі (як у Admin Panel) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px'
        }}
      >
        <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>
          <span>Merchant Panel</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}
        >
          <span>{user?.full_name || 'Merchant'}</span>
          <span>🏢</span>
        </div>
      </div>

      {/* Основна двоколонкова сітка: зліва меню, справа робоча область */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '250px 1fr',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* ЛІВА ПАНЕЛЬ НАВІГАЦІЇ */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {menuItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                style={{
                  textAlign: 'left',
                  padding: '13px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '600',
                  backgroundColor: isActive ? 'rgba(148, 163, 184, 0.16)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'background-color 0.2s ease, color 0.2s ease'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ПРАВА ПАНЕЛЬ КОНТЕНТУ */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '28px'
          }}
        >
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Завантаження даних кабінету...</p>
          ) : (
            <>
              {/* ВКЛАДКА 1: СТАТИСТИКА (3 KPI-картки як на скріншоті Admin Panel) */}
              {activeTab === 'stats' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '22px' }}>
                    Загальна статистика бізнесу
                  </h2>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                      gap: '18px'
                    }}
                  >
                    {/* Картка 1: Мої заклади */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '18px',
                        padding: '22px'
                      }}
                    >
                      <div style={{ fontSize: '26px', marginBottom: '12px' }}>🏢</div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-muted)',
                          marginBottom: '6px'
                        }}
                      >
                        Мої заклади
                      </div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: '800',
                          color: '#0ea5e9',
                          marginBottom: '14px'
                        }}
                      >
                        {myPlaces.length}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '14px',
                          fontSize: '12px',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <span>
                          Підтверджені: <strong style={{ color: '#10b981' }}>{verifiedCount}</strong>
                        </span>
                        <span>
                          Очікують: <strong style={{ color: '#f59e0b' }}>{pendingCount}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Картка 2: Мої акції */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '18px',
                        padding: '22px'
                      }}
                    >
                      <div style={{ fontSize: '26px', marginBottom: '12px' }}>🎁</div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-muted)',
                          marginBottom: '6px'
                        }}
                      >
                        Мої активні акції
                      </div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: '800',
                          color: '#f43f5e',
                          marginBottom: '14px'
                        }}
                      >
                        {myPromotions.length}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Опубліковано в каталозі:{' '}
                        <strong style={{ color: '#10b981' }}>{myPromotions.length}</strong>
                      </div>
                    </div>

                    {/* Картка 3: Конкуренти на платформі */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '18px',
                        padding: '22px'
                      }}
                    >
                      <div style={{ fontSize: '26px', marginBottom: '12px' }}>📊</div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-muted)',
                          marginBottom: '6px'
                        }}
                      >
                        Ринок та конкуренти
                      </div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: '800',
                          color: '#8b5cf6',
                          marginBottom: '14px'
                        }}
                      >
                        {allPromotions.length}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          fontSize: '12px',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <span>
                          Акції інших закладів:{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {competitorPromosCount}
                          </strong>
                        </span>
                        <span>
                          Ваша частка:{' '}
                          <strong style={{ color: '#6366f1' }}>
                            {allPromotions.length > 0
                              ? Math.round((myPromotions.length / allPromotions.length) * 100)
                              : 0}
                            %
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ВКЛАДКА 2: МОЇ ЗАКЛАДИ */}
              {activeTab === 'places' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px'
                    }}
                  >
                    <h2 style={{ fontSize: '20px', fontWeight: '800' }}>
                      Мої заклади ({myPlaces.length})
                    </h2>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setActiveTab('add-place')}
                    >
                      + Новий заклад
                    </button>
                  </div>

                  {myPlaces.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>
                      У вас ще немає створених закладів. Натисніть «+ Додати заклад».
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {myPlaces.map((pl) => (
                        <div
                          key={pl.id}
                          style={{
                            backgroundColor: 'var(--bg-page)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '14px',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                overflow: 'hidden'
                              }}
                            >
                              {renderPreviewImg(pl.logo_url, '🏢')}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '16px' }}>{pl.name}</div>
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                📍 {pl.address} • ⭐ {Number(pl.rating || 4.5).toFixed(1)}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              padding: '6px 12px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: '700',
                              backgroundColor: pl.is_verified
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                              color: pl.is_verified ? '#10b981' : '#f59e0b'
                            }}
                          >
                            {pl.is_verified ? 'Підтверджено' : 'Очікує модерації'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ВКЛАДКА 3: ДОДАТИ ЗАКЛАД */}
              {activeTab === 'add-place' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>
                    Реєстрація нового закладу
                  </h2>

                  <form
                    onSubmit={handleCreatePlace}
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}
                  >
                    <input
                      type="text"
                      placeholder="Назва закладу (наприклад, Львівські Круасани)"
                      value={placeForm.name}
                      onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Адреса (наприклад, вул. Грушевського, 12)"
                      value={placeForm.address}
                      onChange={(e) => setPlaceForm({ ...placeForm, address: e.target.value })}
                      required
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <select
                        value={placeForm.region_id}
                        onChange={(e) => setPlaceForm({ ...placeForm, region_id: e.target.value })}
                        required
                      >
                        <option value="">Оберіть місто</option>
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={placeForm.category_id}
                        onChange={(e) => setPlaceForm({ ...placeForm, category_id: e.target.value })}
                        required
                      >
                        <option value="">Оберіть категорію</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="URL фото/логотипу або завантажте файл нижче"
                      value={placeForm.logo_url}
                      onChange={(e) => setPlaceForm({ ...placeForm, logo_url: e.target.value })}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'place')}
                      />
                      {uploading && <span style={{ fontSize: '13px' }}>Завантаження...</span>}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                      Створити заклад
                    </button>
                  </form>
                </div>
              )}

              {/* ВКЛАДКА 4: МОЇ АКЦІЇ */}
              {activeTab === 'promos' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px'
                    }}
                  >
                    <h2 style={{ fontSize: '20px', fontWeight: '800' }}>
                      Мої акції та знижки ({myPromotions.length})
                    </h2>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setActiveTab('add-promo')}
                    >
                      + Нова акція
                    </button>
                  </div>

                  {myPromotions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>
                      У ваших закладів ще немає активних акцій.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {myPromotions.map((pr) => (
                        <div
                          key={pr.id}
                          style={{
                            backgroundColor: 'var(--bg-page)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '14px',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                overflow: 'hidden'
                              }}
                            >
                              {renderPreviewImg(pr.image_url, '🎁')}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '15px' }}>
                                {pr.title}{' '}
                                <span
                                  style={{
                                    backgroundColor: '#ef4444',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    marginLeft: '6px'
                                  }}
                                >
                                  {pr.discount_value}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                🏢 {pr.place_name}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDeletePromo(pr.id)}
                          >
                            Видалити
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ВКЛАДКА 5: ДОДАТИ АКЦІЮ */}
              {activeTab === 'add-promo' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>
                    Публікація нової акції
                  </h2>

                  <form
                    onSubmit={handleCreatePromo}
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}
                  >
                    <select
                      value={promoForm.place_id}
                      onChange={(e) => setPromoForm({ ...promoForm, place_id: e.target.value })}
                      required
                    >
                      <option value="">Оберіть ваш заклад</option>
                      {myPlaces.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Заголовок акції (наприклад, Знижка -30% на каву)"
                      value={promoForm.title}
                      onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                      required
                    />

                    <input
                      type="text"
                      placeholder="Розмір знижки (наприклад, -30% або 1+1=3)"
                      value={promoForm.discount_value}
                      onChange={(e) =>
                        setPromoForm({ ...promoForm, discount_value: e.target.value })
                      }
                      required
                    />

                    <textarea
                      rows="3"
                      placeholder="Опис умов акції..."
                      value={promoForm.description}
                      onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    />

                    <input
                      type="text"
                      placeholder="Посилання на сайт або промокод (необов'язково)"
                      value={promoForm.link_url}
                      onChange={(e) => setPromoForm({ ...promoForm, link_url: e.target.value })}
                    />

                    <input
                      type="text"
                      placeholder="URL фото акції або завантажте файл нижче"
                      value={promoForm.image_url}
                      onChange={(e) => setPromoForm({ ...promoForm, image_url: e.target.value })}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'promo')}
                      />
                      {uploading && <span style={{ fontSize: '13px' }}>Завантаження...</span>}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                      Опублікувати акцію
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
function AdminPanel({ user: propUser }) {
  const user = propUser || JSON.parse(localStorage.getItem('user') || 'null');

  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [pendingPlaces, setPendingPlaces] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, pendingRes, promosRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', authHeaders),
        axios.get('http://localhost:5000/api/admin/users', authHeaders),
        axios.get('http://localhost:5000/api/admin/places/pending', authHeaders),
        axios.get('http://localhost:5000/api/promotions')
      ]);

      setStats(statsRes.data || {});
      setUsers(usersRes.data || []);
      setPendingPlaces(pendingRes.data || []);
      setPromotions(promosRes.data || []);
    } catch (err) {
      console.error('Помилка завантаження адмін-панелі:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role: newRole },
        authHeaders
      );
      fetchAdminData();
    } catch (err) {
      alert('Помилка зміни ролі користувача');
    }
  };

  const handleApprovePlace = async (placeId, isVerified) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/places/${placeId}/approve`,
        { is_verified: isVerified },
        authHeaders
      );
      fetchAdminData();
    } catch (err) {
      alert('Помилка оновлення статусу закладу');
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!window.confirm('Видалити цю акцію з платформи?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/promotions/${promoId}`, authHeaders);
      fetchAdminData();
    } catch (err) {
      alert('Помилка видалення акції');
    }
  };

  const clientsCount = users.filter((u) => u.role === 'user').length;
  const merchantsCount = users.filter((u) => u.role === 'merchant').length;
  const adminsCount = users.filter((u) => u.role === 'admin').length;

  const totalPlaces = Number(stats.total_places ?? stats.places_count ?? 0);
  const verifiedPlaces = Number(
    stats.verified_places ?? Math.max(0, totalPlaces - pendingPlaces.length)
  );
  const totalPromos = Number(stats.total_promotions ?? promotions.length);

  const menuItems = [
    { key: 'stats', label: 'Статистика' },
    { key: 'places', label: `Запити закладів (${pendingPlaces.length})` },
    { key: 'users', label: `Користувачі (${users.length})` },
    { key: 'promos', label: `Модерація акцій (${promotions.length})` }
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 24px 60px' }}>
      {/* Верхній рядок панелі (ідентичний Merchant Panel) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px'
        }}
      >
        <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>
          <span style={{ color: '#6366f1' }}>Promo</span>{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>|</span>{' '}
          <span>Admin Panel</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}
        >
          <span>{user?.full_name || 'Super Admin'}</span>
          <span>🛡️</span>
        </div>
      </div>

      {/* Основна двоколонкова сітка */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '250px 1fr',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* ЛІВА ПАНЕЛЬ НАВІГАЦІЇ */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {menuItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                style={{
                  textAlign: 'left',
                  padding: '13px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '600',
                  backgroundColor: isActive ? 'rgba(148, 163, 184, 0.16)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'background-color 0.2s ease, color 0.2s ease'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ПРАВА ПАНЕЛЬ КОНТЕНТУ */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '28px'
          }}
        >
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Завантаження даних панелі...</p>
          ) : (
            <>
              {/* ВКЛАДКА 1: СТАТИСТИКА */}
              {activeTab === 'stats' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '22px' }}>
                    Загальна статистика платформи
                  </h2>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                      gap: '18px'
                    }}
                  >
                    {/* Картка 1: Заклади */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '18px',
                        padding: '22px'
                      }}
                    >
                      <div style={{ fontSize: '26px', marginBottom: '12px' }}>🏢</div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-muted)',
                          marginBottom: '6px'
                        }}
                      >
                        Всього закладів
                      </div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: '800',
                          color: '#0ea5e9',
                          marginBottom: '14px'
                        }}
                      >
                        {totalPlaces}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '14px',
                          fontSize: '12px',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <span>
                          Підтверджені: <strong style={{ color: '#10b981' }}>{verifiedPlaces}</strong>
                        </span>
                        <span>
                          Очікують:{' '}
                          <strong style={{ color: '#f59e0b' }}>{pendingPlaces.length}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Картка 2: Акції */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '18px',
                        padding: '22px'
                      }}
                    >
                      <div style={{ fontSize: '26px', marginBottom: '12px' }}>🎁</div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-muted)',
                          marginBottom: '6px'
                        }}
                      >
                        Всього акцій
                      </div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: '800',
                          color: '#f43f5e',
                          marginBottom: '14px'
                        }}
                      >
                        {totalPromos}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Активних зараз:{' '}
                        <strong style={{ color: '#10b981' }}>{promotions.length}</strong>
                      </div>
                    </div>

                    {/* Картка 3: Користувачі */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '18px',
                        padding: '22px'
                      }}
                    >
                      <div style={{ fontSize: '26px', marginBottom: '12px' }}>👥</div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-muted)',
                          marginBottom: '6px'
                        }}
                      >
                        Користувачі
                      </div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: '800',
                          color: '#8b5cf6',
                          marginBottom: '14px'
                        }}
                      >
                        {users.length}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          fontSize: '12px',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <span>
                          Клієнти:{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>{clientsCount}</strong>
                        </span>
                        <span>
                          Продавці (Merchant):{' '}
                          <strong style={{ color: '#6366f1' }}>{merchantsCount}</strong>
                        </span>
                        <span>
                          Адміни: <strong style={{ color: '#f43f5e' }}>{adminsCount}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ВКЛАДКА 2: ЗАПИТИ ЗАКЛАДІВ */}
              {activeTab === 'places' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>
                    Запити на підтвердження закладів ({pendingPlaces.length})
                  </h2>

                  {pendingPlaces.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>
                      Немає нових закладів, що очікують перевірки.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {pendingPlaces.map((pl) => (
                        <div
                          key={pl.id}
                          style={{
                            backgroundColor: 'var(--bg-page)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '16px' }}>{pl.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              📍 {pl.address}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleApprovePlace(pl.id, true)}
                            >
                              Підтвердити
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => handleApprovePlace(pl.id, false)}
                            >
                              Відхилити
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ВКЛАДКА 3: КОРИСТУВАЧІ */}
              {activeTab === 'users' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>
                    Керування користувачами ({users.length})
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {users.map((u) => (
                      <div
                        key={u.id}
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '15px' }}>
                            {u.full_name || 'Користувач'}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {u.email}
                          </div>
                        </div>

                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{
                            minWidth: '150px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            fontWeight: '600'
                          }}
                        >
                          <option value="user">user (Клієнт)</option>
                          <option value="merchant">merchant (Бізнес)</option>
                          <option value="admin">admin (Адмін)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ВКЛАДКА 4: МОДЕРАЦІЯ АКЦІЙ */}
              {activeTab === 'promos' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>
                    Модерація акцій ({promotions.length})
                  </h2>

                  {promotions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Активних акцій на платформі немає.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {promotions.map((pr) => (
                        <div
                          key={pr.id}
                          style={{
                            backgroundColor: 'var(--bg-page)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '15px' }}>
                              {pr.title}{' '}
                              <span
                                style={{
                                  backgroundColor: '#ef4444',
                                  color: '#fff',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  marginLeft: '6px'
                                }}
                              >
                                {pr.discount_value}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              🏢 {pr.place_name}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDeletePromo(pr.id)}
                          >
                            Видалити
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ПІДВАЛ САЙТУ (FULL-WIDTH FOOTER)
// ==========================================
function Footer() {
  return (
    <footer style={{
      width: '100%',
      marginTop: 'auto',
      background: '#fff',
      borderTop: '1px solid #e2e8f0',
      padding: '28px 32px',
      color: '#64748b',
      fontSize: '14px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <PromoLogo size={34} fontSize="22px" />
        </Link>
        <div>© 2026 PromoHUB. Усі права захищено. Платформа локальних знижок та акцій.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Про нас</Link>
          <Link to="/merchant" style={{ color: '#64748b', textDecoration: 'none' }}>Для бізнесу</Link>
          <a href="mailto:support@promohub.com" style={{ color: '#64748b', textDecoration: 'none' }}>Підтримка</a>
        </div>
      </div>
    </footer>
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
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<MainPage user={currentUser} token={token} activeRegion={activeRegion} searchQuery={searchQuery} showToast={showToast} />} />
            <Route path="/place/:id" element={<PlacePage token={token} user={currentUser} showToast={showToast} />} />
            <Route path="/login" element={<AuthPage initialMode="login" onLogin={setCurrentUser} />} />
            <Route path="/register" element={<AuthPage initialMode="register" onLogin={setCurrentUser} />} />
            <Route path="/merchant" element={<MerchantCabinet />} />
            <Route
              path="/admin"
              element={currentUser?.role === 'admin' ? <AdminPanel token={token} showToast={showToast} /> : <Navigate to="/" />}
            />
            <Route path="/favorites" element={<FavoritesPage token={token} user={currentUser} showToast={showToast} />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage showToast={showToast} />} />
          </Routes>
        </main>
        <Footer />
      </div>

      {/* 📍 МОДАЛЬНЕ ВІКНО ВИБОРУ МІСТА */}
      {showRegionModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px', borderRadius: '20px', padding: '40px' }}>
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

// ==========================================
// СТОРІНКА ВСТАНОВЛЕННЯ НОВОГО ПАРОЛЯ
// ==========================================
function ResetPasswordPage({ showToast }) {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast('Паролі не збігаються!', 'error');
      return;
    }

    axios.post(`${API_URL}/auth/reset-password`, { token, newPassword })
      .then(res => {
        showToast(res.data.message, 'success');
        navigate('/login', { state: { isRegister: false } });
      })
      .catch(err => showToast(err.response?.data?.error || 'Помилка скидання пароля', 'error'));
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '36px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Новий пароль</h2>
        <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', marginBottom: '20px' }}>
          Введіть та підтвердіть свій новий пароль
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="password"
            className="input-field"
            placeholder="Новий пароль (мін. 6 символів)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-field"
            placeholder="Підтвердіть новий пароль"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Зберегти новий пароль
          </button>
        </form>
      </div>
    </div>
  );
}