import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/promotions')
      .then((response) => {
        setPromotions(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Помилка завантаження даних:', err);
        setError('Не вдалося завантажити акції. Перевірте, чи запущено BackEnd.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">Promo 🏷️</h1>
        <div className="region-tag">📍 Львів</div>
      </header>

      <main>
        <h2>Гарячі акції та знижки дня 🔥</h2>

        {loading && <p>Завантаження акцій із бази даних...</p>}
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}

        {!loading && !error && (
          <div className="grid">
            {promotions.map((promo) => (
              <div key={promo.id} className="card">
                <div>
                  <span className="badge">{promo.discount_value}</span>
                  <h3 className="card-title">{promo.title}</h3>
                  <p className="card-desc">{promo.description}</p>
                  <div className="place-info">🏬 {promo.place_name}</div>
                  <div className="address">📍 {promo.address}</div>
                </div>
                <button className="button">Отримати пропозицію</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;