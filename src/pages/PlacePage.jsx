import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function PlacePage({ token }) {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/places/${id}`)
            .then(res => { setData(res.data); setLoading(false); })
            .catch(err => console.error(err));
    }, [id]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Завантаження сторінки закладу...</div>;
    if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Заклад не знайдено</div>;

    const { place, promotions } = data;

    return (
        <div className="container" style={{ paddingTop: '20px' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 'bold' }}>← На головну</Link>

            {/* Баннер закладу */}
            <div style={{
                position: 'relative',
                height: '180px',
                background: '#334155',
                borderRadius: '20px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '28px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }}>
                {place.name}
                {/* Логотип закладу */}
                <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '30px',
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px'
                }}>
                    {place.logo_url || '🏬'}
                </div>
            </div>

            {/* Інформація про заклад */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>{place.name}</h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>
                        ⭐ {place.rating || '4.8'} • 📍 {place.address}, {place.region_name}
                    </p>
                </div>
                <button className="button" style={{ width: 'auto', background: '#8b5cf6' }}>❤️ В обране</button>
            </div>

            {/* Активні акції цього закладу */}
            <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>Активні акції ({promotions.length})</h2>

            <div className="grid">
                {promotions.map(promo => (
                    <div key={promo.id} className="card">
                        <span className="badge">{promo.discount_value}</span>
                        <h3 className="card-title">{promo.title}</h3>
                        <p className="card-desc">{promo.description}</p>
                        <div className="place-info">⏰ Дійсна до: {new Date(promo.end_date).toLocaleDateString()}</div>
                        <button className="button" style={{ marginTop: '16px' }}>Отримати купон / промокод</button>
                    </div>
                ))}
            </div>
        </div>
    );
}