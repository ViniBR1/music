'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [purchasedModules, setPurchasedModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user?.role && session.user.role !== 'student') {
      router.push('/login');
      return;
    }

    if (session?.user?.id) {
      fetchData();
    }
  }, [session, status]);

  const fetchData = async () => {
    try {
      const modulesRes = await fetch('/api/modules');
      const modulesData = await modulesRes.json();
      setModules(Array.isArray(modulesData) ? modulesData : []);

      const purchasesRes = await fetch(`/api/purchases?studentId=${session.user.id}`);
      const purchasesData = await purchasesRes.json();
      setPurchasedModules(Array.isArray(purchasesData) ? purchasesData : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setModules([]);
      setPurchasedModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (moduleId) => {
    try {
      router.push(`/student/purchase/${moduleId}`);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar compra');
    }
  };

  const handleWatchPreview = (module) => {
    setSelectedModule(module);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedModule(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>⏳ Carregando...</h2>
          <p style={{ color: '#666' }}>Carregando seus cursos</p>
        </div>
      </div>
    );
  }

  const purchased = Array.isArray(purchasedModules) ? purchasedModules : [];
  const available = Array.isArray(modules) ? modules : [];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', color: '#1a1a2e', margin: 0 }}>
          👋 Olá, {session?.user?.name}!
        </h1>
        <p style={{ color: '#666', marginTop: '5px' }}>
          Bem-vindo à sua área de aluno
        </p>
      </div>

      {/* Ações Rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => router.push('/student/live')}
          style={{
            padding: '20px',
            background: 'white',
            border: '2px solid #8e44ad',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-5px)';
            e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '2rem' }}>🎥</div>
          <div style={{ fontWeight: 'bold', marginTop: '10px' }}>
            Aulas ao Vivo
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
            Participe ao vivo
          </div>
        </button>

        <button
          onClick={() => alert('🔜 Em breve: Chat')}
          style={{
            padding: '20px',
            background: 'white',
            border: '2px solid #f39c12',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-5px)';
            e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '2rem' }}>💬</div>
          <div style={{ fontWeight: 'bold', marginTop: '10px' }}>
            Chat
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
            Com seu professor
          </div>
        </button>
      </div>

      {/* Meus Cursos */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#1a1a2e', marginBottom: '15px' }}>
          📚 Meus Cursos
        </h2>
        
        {purchased.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              📚 Você ainda não comprou nenhum curso
            </p>
            <p style={{ color: '#999', marginTop: '10px' }}>
              Explore os cursos disponíveis abaixo
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {purchased.map(module => (
              <div key={module.id} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '2rem' }}>✅</span>
                  <h3 style={{ color: '#1a1a2e', margin: 0 }}>{module.title}</h3>
                </div>
                <p style={{ color: '#666', marginTop: '10px' }}>
                  {module.description}
                </p>
                <div style={{
                  marginTop: '15px',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => router.push(`/student/modules/${module.id}`)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    ▶️ Assistir Aulas
                  </button>
                  <button
                    onClick={() => alert('💬 Chat em breve!')}
                    style={{
                      padding: '10px',
                      background: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    💬
                  </button>
                </div>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#999',
                  marginTop: '10px'
                }}>
                  📹 {module.lessons?.length || 0} aulas disponíveis
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cursos Disponíveis */}
      <div>
        <h2 style={{ color: '#1a1a2e', marginBottom: '15px' }}>
          🎯 Cursos Disponíveis
        </h2>
        
        {available.filter(m => !purchased.some(p => p.id === m.id)).length === 0 ? (
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              🎉 Você já comprou todos os cursos disponíveis!
            </p>
            <p style={{ color: '#999' }}>
              Em breve novos cursos serão adicionados
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {available
              .filter(m => !purchased.some(p => p.id === m.id))
              .map(module => (
                <div key={module.id} style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }}>
                  <h3 style={{ color: '#1a1a2e' }}>{module.title}</h3>
                  <p style={{ color: '#666', marginTop: '5px' }}>
                    {module.description}
                  </p>
                  <p style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: '#4a90e2',
                    marginTop: '10px'
                  }}>
                    R$ {module.price}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#999' }}>
                    📹 {module.lessons?.length || 0} aulas
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '15px'
                  }}>
                    {module.free_lesson_url && (
                      <button
                        onClick={() => handleWatchPreview(module)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        🎬 Aula Grátis
                      </button>
                    )}
                    
                    <button
                      onClick={() => handlePurchase(module.id)}
                      style={{
                        flex: module.free_lesson_url ? 1 : 2,
                        padding: '10px',
                        background: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      🛒 Comprar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal de Preview da Aula Grátis */}
      {showPreview && selectedModule && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#1a1a2e', margin: 0 }}>
                🎬 Aula Grátis: {selectedModule.title}
              </h2>
              <button
                onClick={closePreview}
                style={{
                  padding: '8px 16px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ✕ Fechar
              </button>
            </div>

            <div style={{
              background: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              aspectRatio: '16/9',
              marginBottom: '20px'
            }}>
              <iframe
                src={selectedModule.free_lesson_url.replace('watch?v=', 'embed/')}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>

            <p style={{ color: '#666' }}>
              {selectedModule.description}
            </p>

            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={() => {
                  closePreview();
                  handlePurchase(selectedModule.id);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                🛒 Comprar Curso Completo - R$ {selectedModule.price}
              </button>
              <button
                onClick={closePreview}
                style={{
                  padding: '12px 24px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Continuar Explorando
              </button>
            </div>

            <p style={{
              fontSize: '0.8rem',
              color: '#999',
              marginTop: '10px',
              textAlign: 'center'
            }}>
              💡 Esta é uma aula gratuita para você conhecer o curso. 
              Compre o curso completo para ter acesso a todas as aulas!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}