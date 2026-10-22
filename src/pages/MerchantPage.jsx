import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function MerchantCabinet({ token, user }) {
    const [activeTab, setActiveTab] = useState('promos');
    const [myPlaces, setMyPlaces] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);

    // Створення акції
    const [placeId, setPlaceId] = useState('');
    const [title, setTitle] = useState('');
    const [discount, setDiscount] = useState('-20%');

    useEffect(() => {
        axios.get('http://localhost:5000/api/places/my', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setMyPlaces(res.data);
                if (res.data.length > 0) setPlaceId(res.data[0].id);
            });

        axios.get('http://localhost:5000/api/promotions')
            .then(res => setPromotions(res.data));
    }, [token]);

    const handleCreatePromo = (e) => {
        e.preventDefault();
        axios.post('http://localhost:5000/api/promotions', {
            place_id: placeId,
            title,
            discount_value: discount,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, { headers: { Authorization: `Bearer ${token}` } })
            .then(() => {
                alert('Акцію створено!');
                setShowAddModal(false);
                window.location.reload();
            });
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
            {/* Шапка */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    <span style={{ color: '#6366f1' }}>Promo</span> | Кабінет закладу
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    🥐 {user?.full_name || 'Львівські Круасани'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                {/* Бічне меню */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', height: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div
                        onClick={() => setActiveTab('promos')}
                        style={{ padding: '12px 16px', borderRadius: '10px', background: activeTab === 'promos' ? '#f1f5f9' : 'transparent', fontWeight: '600', cursor: 'pointer', color: activeTab === 'promos' ? '#6366f1' : '#475569', marginBottom: '8px' }}
                    >
                        🔥 Мої акції
                    </div>
                    <div style={{ padding: '12px 16px', color: '#94a3b8', cursor: 'not-allowed', marginBottom: '8px' }}>
                        📊 Статистика
                    </div>
                    <div style={{ padding: '12px 16px', color: '#94a3b8', cursor: 'not-allowed', marginBottom: '8px' }}>
                        ⚙️ Налаштування
                    </div>
                    <div style={{ padding: '12px 16px', color: '#94a3b8', cursor: 'not-allowed' }}>
                        💬 Відгуки та скарги
                    </div>
                </div>

                {/* Основна панель */}
                <div>
                    {/* Статистичні картки */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Активних акцій</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '4px' }}>{promotions.length}</div>
                        </div>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Переглядів за тиждень</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>1,240 📈</div>
                        </div>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Збережено в «Обране»</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6', marginTop: '4px' }}>342 💜</div>
                        </div>
                    </div>

                    {/* Таблиця управлінь акціями */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Управління акціями</h3>
                            <button
                                onClick={() => setShowAddModal(true)}
                                style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                + Додати акцію
                            </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                    <th style={{ padding: '12px' }}>Назва акції</th>
                                    <th style={{ padding: '12px' }}>Знижка</th>
                                    <th style={{ padding: '12px' }}>Термін дії</th>
                                    <th style={{ padding: '12px' }}>Статус</th>
                                    <th style={{ padding: '12px' }}>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promotions.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 12px', fontWeight: '600' }}>{p.title}</td>
                                        <td style={{ padding: '16px 12px', color: '#ef4444', fontWeight: 'bold' }}>{p.discount_value}</td>
                                        <td style={{ padding: '16px 12px', color: '#64748b' }}>Щодня до 22:00</td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                                Активна
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px', cursor: 'pointer' }}>✏️ 🗑️</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Модалка створення */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Створення нової акції</h3>
                        <form onSubmit={handleCreatePromo}>
                            <select className="input-field" value={placeId} onChange={e => setPlaceId(e.target.value)} required>
                                {myPlaces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input className="input-field" placeholder="Заголовок акції" value={title} onChange={e => setTitle(e.target.value)} required />
                            <input className="input-field" placeholder="Знижка (наприклад -20%)" value={discount} onChange={e => setDiscount(e.target.value)} required />
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Скасувати</button>
                                <button type="submit" className="button" style={{ width: 'auto' }}>Опублікувати</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}