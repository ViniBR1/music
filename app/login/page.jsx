'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('🔐 Resultado do login:', result);

      if (result?.error) {
        setError('Email ou senha inválidos');
        setLoading(false);
        return;
      }

      // Buscar a sessão atualizada
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      console.log('📝 Sessão após login:', session);

      if (session?.user?.role) {
        console.log('👤 Role do usuário:', session.user.role);
        
        switch(session.user.role) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'teacher':
            router.push('/teacher/dashboard');
            break;
          case 'student':
            router.push('/student/dashboard');
            break;
          default:
            router.push('/');
        }
      } else {
        console.error('❌ Role não encontrado na sessão');
        setError('Erro ao identificar tipo de usuário');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '3rem', margin: 0 }}>🎸</h1>
          <h2 style={{ color: '#1a1a2e' }}>Curso de Contrabaixo</h2>
          <p style={{ color: '#666' }}>Faça login para acessar</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              color: '#555',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              color: '#555',
              fontWeight: '500'
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c00',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '5px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <p style={{ textAlign: 'center', marginBottom: '5px' }}>
            <strong>Credenciais de teste:</strong>
          </p>
          <p style={{ margin: '3px 0' }}>
            👑 Admin: admin@admin.com / admin123
          </p>
          <p style={{ margin: '3px 0' }}>
            👨‍🏫 Professor: teacher@teacher.com / teacher123
          </p>
          <p style={{ margin: '3px 0' }}>
            👨‍🎓 Aluno: student@student.com / student123
          </p>
        </div>
      </div>
    </div>
  );
}