import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function AuthPage({ onAuthSuccess }) {
    const [isRegister, setIsRegister] = useState(true);
    const [accountType, setAccountType] = useState('user'); // 'user' або 'merchant'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
        const payload = isRegister
            ? { email, password, full_name: fullName, role: accountType }
            : { email, password };

        axios.post(`http://localhost:5000${endpoint}`, payload)
            .then(res => {
                onAuthSuccess(res.data.user, res.data.token);
                navigate('/');
            })
            .catch(err => setError(err.response?.data?.error || 'Помилка авторизації'));
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                    {isRegister ? 'Створити акаунт' : 'Вхід у систему'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                    Приєднуйтесь до платформи знижок вашого міста
                </p>

                {isRegister && (
                    <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
                        <button
                            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: accountType === 'user' ? '#fff' : 'transparent', fontWeight: '600', cursor: 'pointer', boxShadow: accountType === 'user' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                            onClick={() => setAccountType('user')}
                        >
                            Користувач
                        </button>
                        <button
                            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: accountType === 'merchant' ? '#fff' : 'transparent', fontWeight: '600', cursor: 'pointer', boxShadow: accountType === 'merchant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                            onClick={() => setAccountType('merchant')}
                        >
                            Заклад / Бізнес
                        </button>
                    </div>
                )}

                {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {isRegister && (
                        <input
                            className="input-field"
                            placeholder={accountType === 'merchant' ? "Назва компанії" : "ПІБ"}
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                        />
                    )}
                    <input className="input-field" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input className="input-field" type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />

                    <button type="submit" className="button" style={{ background: '#6366f1', padding: '12px' }}>
                        {isRegister ? 'Зареєструватися' : 'Увійти'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
                    {isRegister ? 'Вже є акаунт? ' : 'Немає акаунту? '}
                    <span style={{ color: '#6366f1', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsRegister(!isRegister)}>
                        {isRegister ? 'Увійти' : 'Зареєструватися'}
                    </span>
                </p>
            </div>
        </div>
    );
}