import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminPanel({ token }) {
    const [pendingPlaces, setPendingPlaces] = useState([]);
    const [activeTab, setActiveTab] = useState('requests');

    const fetchPending = () => {
        axios.get('http://localhost:5000/api/admin/places/pending', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setPendingPlaces(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchPending();
    }, [token]);

    const handleApprove = (id, isApproved) => {
        axios.put(`http://localhost:5000/api/admin/places/${id}/approve`,
            { is_verified: isApproved },
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then(() => {
                alert(isApproved ? 'Заклад підтверджено!' : 'Запит відхилено');
                fetchPending();
            });
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '24px' }}>
            {/* Шапка */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    <span style={{ color: '#818cf8' }}>Promo</span> | Admin Panel
                </h2>
                <div style={{ fontWeight: 'bold', color: '#94a3b8' }}>SuperAdmin 🛡️</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                {/* Темне бічне меню */}
                <div style={{ background: '#1e293b', borderRadius: '16px', padding: '16px', height: 'fit-content' }}>
                    <div
                        onClick={() => setActiveTab('requests')}
                        style={{ padding: '12px 16px', borderRadius: '10px', background: activeTab === 'requests' ? '#334155' : 'transparent', fontWeight: '600', cursor: 'pointer', color: '#fff', marginBottom: '8px' }}
                    >
                        Запити закладів ({pendingPlaces.length})
                    </div>
                    <div style={{ padding: '12px 16px', color: '#64748b', cursor: 'not-allowed', marginBottom: '8px' }}>
                        Скарги на акції (0)
                    </div>
                    <div style={{ padding: '12px 16px', color: '#64748b', cursor: 'not-allowed', marginBottom: '8px' }}>
                        Користувачі
                    </div>
                    <div style={{ padding: '12px 16px', color: '#64748b', cursor: 'not-allowed' }}>
                        Системний лог
                    </div>
                </div>

                {/* Основна зона */}
                <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>
                        Запити на підтвердження закладів
                    </h3>

                    <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px' }}>
                        {pendingPlaces.length === 0 ? (
                            <p style={{ color: '#94a3b8' }}>Немає нових запитів на модерацію.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                                        <th style={{ padding: '12px' }}>Назва закладу</th>
                                        <th style={{ padding: '12px' }}>Категорія / Місто</th>
                                        <th style={{ padding: '12px' }}>Дата реєстрації</th>
                                        <th style={{ padding: '12px' }}>Рішення</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingPlaces.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{p.name}</td>
                                            <td style={{ padding: '16px 12px', color: '#cbd5e1' }}>{p.category_name} • {p.region_name}</td>
                                            <td style={{ padding: '16px 12px', color: '#94a3b8' }}>Сьогодні, 14:20</td>
                                            <td style={{ padding: '16px 12px', display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleApprove(p.id, true)}
                                                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    Прийняти
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(p.id, false)}
                                                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    Відхилити
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}