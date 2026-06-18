'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [showStudents, setShowStudents] = useState(false);
  
  // Estado para novo módulo com múltiplas aulas
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    price: '',
    is_free: false,
    free_lesson_url: '',
    lessons: []
  });

  // Estado para aula atual (para adicionar na lista)
  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    youtube_url: '',
    description: '',
    is_free_preview: false
  });

  useEffect(() => {
    console.log('📊 Status da sessão:', status);
    console.log('📊 Dados da sessão:', session);

    if (status === 'unauthenticated') {
      console.log('❌ Usuário não autenticado, redirecionando para login...');
      router.push('/login');
      return;
    }

    if (status === 'loading') {
      console.log('⏳ Carregando sessão...');
      return;
    }

    if (session?.user) {
      console.log('👤 Usuário logado:', session.user);
      console.log('👤 Role do usuário:', session.user.role);
      console.log('👤 ID do usuário:', session.user.id);
      
      if (session.user.role !== 'teacher') {
        console.log('❌ Usuário não é professor (role:', session.user.role, '), redirecionando...');
        router.push('/login');
        return;
      }
    } else {
      console.log('⚠️ Sessão sem usuário');
      router.push('/login');
      return;
    }

    if (session?.user?.id) {
      console.log('✅ Usuário professor autenticado, buscando dados...');
      fetchModules();
      fetchStudents();
    }
  }, [session, status]);

  const fetchModules = async () => {
    try {
      console.log('📡 Buscando módulos do professor:', session.user.id);
      const response = await fetch(`/api/modules?teacherId=${session.user.id}`);
      const data = await response.json();
      console.log('📦 Módulos encontrados:', data.length);
      setModules(data);
    } catch (error) {
      console.error('❌ Erro ao carregar módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('📡 Buscando alunos do professor:', session.user.id);
      const response = await fetch(`/api/teacher/students?teacherId=${session.user.id}`);
      const data = await response.json();
      console.log('📦 Alunos encontrados:', data.length);
      setStudents(data);
    } catch (error) {
      console.error('❌ Erro ao carregar alunos:', error);
    }
  };

  // Adicionar aula à lista
  const addLessonToList = () => {
    if (!currentLesson.title || !currentLesson.youtube_url) {
      alert('⚠️ Preencha título e URL do YouTube da aula');
      return;
    }

    console.log('➕ Adicionando aula à lista:', currentLesson.title);
    setNewModule({
      ...newModule,
      lessons: [...newModule.lessons, { ...currentLesson }]
    });
    
    setCurrentLesson({
      title: '',
      youtube_url: '',
      description: '',
      is_free_preview: false
    });
  };

  // Remover aula da lista
  const removeLessonFromList = (index) => {
    console.log('🗑️ Removendo aula índice:', index);
    const updatedLessons = newModule.lessons.filter((_, i) => i !== index);
    setNewModule({ ...newModule, lessons: updatedLessons });
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    
    if (!newModule.title) {
      alert('⚠️ Título do módulo é obrigatório');
      return;
    }

    console.log('📦 Criando módulo:', newModule.title);
    console.log('📦 Com aulas:', newModule.lessons.length);

    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newModule,
          teacherId: session.user.id,
          price: parseFloat(newModule.price) || 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Módulo criado com sucesso:', data);
        setShowModal(false);
        setNewModule({ 
          title: '', 
          description: '', 
          price: '', 
          is_free: false, 
          free_lesson_url: '',
          lessons: []
        });
        fetchModules();
        alert(`✅ Módulo criado com ${data.lessons?.length || 0} aulas!`);
      } else {
        console.error('❌ Erro ao criar módulo:', data);
        alert(`❌ Erro: ${data.error || 'Erro ao criar módulo'}`);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      alert('❌ Erro ao criar módulo');
    }
  };

  const handleAddLesson = async (moduleId) => {
    if (!currentLesson.title || !currentLesson.youtube_url) {
      alert('⚠️ Preencha título e URL do YouTube');
      return;
    }

    console.log('📹 Adicionando aula ao módulo:', moduleId);
    console.log('📹 Aula:', currentLesson.title);

    try {
      const response = await fetch(`/api/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLesson)
      });

      if (response.ok) {
        console.log('✅ Aula adicionada com sucesso');
        setCurrentLesson({ title: '', youtube_url: '', description: '', is_free_preview: false });
        fetchModules();
        alert('✅ Aula adicionada com sucesso!');
      } else {
        const data = await response.json();
        console.error('❌ Erro ao adicionar aula:', data);
        alert('❌ Erro ao adicionar aula');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      alert('❌ Erro ao adicionar aula');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Tem certeza que deseja excluir este módulo?')) return;

    console.log('🗑️ Excluindo módulo:', moduleId);

    try {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Módulo excluído com sucesso');
        fetchModules();
        alert('✅ Módulo excluído com sucesso!');
      } else {
        alert('❌ Erro ao excluir módulo');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      alert('❌ Erro ao excluir módulo');
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return;

    console.log('🗑️ Excluindo aula:', lessonId, 'do módulo:', moduleId);

    try {
      const response = await fetch(`/api/modules/${moduleId}/lessons?lessonId=${lessonId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Aula excluída com sucesso');
        fetchModules();
        alert('✅ Aula excluída com sucesso!');
      } else {
        alert('❌ Erro ao excluir aula');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      alert('❌ Erro ao excluir aula');
    }
  };

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalRevenue = modules.reduce((acc, m) => acc + (parseFloat(m.price) || 0), 0);

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
          <p style={{ color: '#666' }}>Carregando seus módulos</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#1a1a2e', margin: 0 }}>
            👨‍🏫 Painel do Professor
          </h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Bem-vindo, {session?.user?.name}!
          </p>
          <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '5px' }}>
            Role: {session?.user?.role} | ID: {session?.user?.id}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '12px 24px',
            background: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          ➕ Criar Módulo
        </button>
      </div>

      {/* Estatísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0', color: '#666' }}>📚 Módulos</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#4a90e2',
            margin: '10px 0 0 0'
          }}>
            {modules.length}
          </p>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0', color: '#666' }}>📹 Aulas</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#27ae60',
            margin: '10px 0 0 0'
          }}>
            {totalLessons}
          </p>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0', color: '#666' }}>💰 Receita</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#f39c12',
            margin: '10px 0 0 0'
          }}>
            R$ {totalRevenue.toFixed(2)}
          </p>
        </div>
        <div 
          onClick={() => setShowStudents(!showStudents)}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
        >
          <h3 style={{ margin: '0', color: '#666' }}>👨‍🎓 Alunos</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#8e44ad',
            margin: '10px 0 0 0'
          }}>
            {students.length}
          </p>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '20px',
            background: 'white',
            border: '2px solid #4a90e2',
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
          <div style={{ fontSize: '2rem' }}>📚</div>
          <div style={{ fontWeight: 'bold', marginTop: '10px' }}>
            Criar Módulo
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
            Com várias aulas
          </div>
        </button>

        <button
          onClick={() => router.push('/teacher/live')}
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
            Agendar e transmitir
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
            Com seus alunos
          </div>
        </button>
      </div>

      {/* Lista de Alunos */}
      {showStudents && students.length > 0 && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#1a1a2e' }}>👨‍🎓 Meus Alunos</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Módulo</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{student.name}</td>
                    <td style={{ padding: '10px' }}>{student.email}</td>
                    <td style={{ padding: '10px' }}>{student.module_title}</td>
                    <td style={{ padding: '10px' }}>
                      {new Date(student.purchase_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Meus Módulos */}
      <div>
        <h2 style={{ color: '#1a1a2e', marginBottom: '20px' }}>📚 Meus Módulos</h2>

        {modules.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>
              📚 Você ainda não criou nenhum módulo
            </p>
            <p style={{ color: '#999' }}>
              Clique em "Criar Módulo" para começar
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '20px'
          }}>
            {modules.map(module => (
              <div key={module.id} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '15px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#1a1a2e', margin: 0 }}>
                      {module.title}
                      {module.is_free && (
                        <span style={{
                          marginLeft: '10px',
                          fontSize: '0.8rem',
                          background: '#27ae60',
                          color: 'white',
                          padding: '2px 10px',
                          borderRadius: '15px'
                        }}>
                          Grátis
                        </span>
                      )}
                    </h3>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                      {module.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      marginTop: '10px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>
                        R$ {module.price}
                      </span>
                      <span style={{ color: '#666' }}>
                        📹 {module.lessons?.length || 0} aulas
                      </span>
                      {module.free_lesson_url && (
                        <span style={{ color: '#f39c12' }}>
                          🎬 Aula gratuita disponível
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => {
                        setEditingModule(module);
                        setNewModule({
                          title: module.title,
                          description: module.description,
                          price: module.price.toString(),
                          is_free: module.is_free,
                          free_lesson_url: module.free_lesson_url || '',
                          lessons: []
                        });
                        setShowModal(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#f39c12',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>

                {/* Lista de Aulas */}
                <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📹 Aulas:</h4>
                  
                  {module.lessons?.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '0.9rem' }}>
                      Nenhuma aula adicionada ainda
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {module.lessons?.map((lesson, index) => (
                        <div key={lesson.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: '#f8f9fa',
                          borderRadius: '5px',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div>
                            <strong>{index + 1}.</strong> {lesson.title}
                            {lesson.is_free_preview && (
                              <span style={{
                                marginLeft: '10px',
                                fontSize: '0.7rem',
                                background: '#27ae60',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px'
                              }}>
                                🔓 Aula Grátis (Preview)
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <a
                              href={lesson.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#ff0000',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                              }}
                            >
                              ▶️ Ver no YouTube
                            </a>
                            <button
                              onClick={() => handleDeleteLesson(module.id, lesson.id)}
                              style={{
                                padding: '4px 10px',
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulário para adicionar aula individual */}
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: '#f5f5f5',
                    borderRadius: '8px'
                  }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#555' }}>
                      ➕ Adicionar Nova Aula
                    </h5>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px'
                    }}>
                      <input
                        type="text"
                        placeholder="Título da aula"
                        value={currentLesson.title}
                        onChange={(e) => setCurrentLesson({...currentLesson, title: e.target.value})}
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '5px'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="URL do YouTube"
                        value={currentLesson.youtube_url}
                        onChange={(e) => setCurrentLesson({...currentLesson, youtube_url: e.target.value})}
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '5px'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Descrição (opcional)"
                        value={currentLesson.description}
                        onChange={(e) => setCurrentLesson({...currentLesson, description: e.target.value})}
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '5px',
                          gridColumn: '1 / -1'
                        }}
                      />
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        gridColumn: '1 / -1',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={currentLesson.is_free_preview}
                          onChange={(e) => setCurrentLesson({...currentLesson, is_free_preview: e.target.checked})}
                        />
                        <span>🔓 Marcar como aula gratuita (alunos podem assistir antes de comprar)</span>
                      </label>
                      <button
                        onClick={() => handleAddLesson(module.id)}
                        style={{
                          gridColumn: '1 / -1',
                          padding: '10px',
                          background: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        ➕ Adicionar Aula
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Criar/Editar Módulo com Múltiplas Aulas */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: '#1a1a2e', marginTop: 0 }}>
              {editingModule ? '✏️ Editar Módulo' : '📚 Criar Módulo com Aulas'}
            </h2>
            
            <form onSubmit={handleCreateModule}>
              {/* Dados do Módulo */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500' }}>
                  Título do Módulo *
                </label>
                <input
                  type="text"
                  required
                  value={newModule.title}
                  onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500' }}>
                  Descrição
                </label>
                <textarea
                  value={newModule.description}
                  onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    minHeight: '80px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500' }}>
                  Preço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newModule.price}
                  onChange={(e) => setNewModule({...newModule, price: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#555',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={newModule.is_free}
                    onChange={(e) => setNewModule({...newModule, is_free: e.target.checked})}
                  />
                  📢 Módulo gratuito
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500' }}>
                  🎬 URL da Aula Grátis (Preview)
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={newModule.free_lesson_url}
                  onChange={(e) => setNewModule({...newModule, free_lesson_url: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '1rem'
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                  Alunos poderão assistir esta aula antes de comprar o módulo
                </p>
              </div>

              {/* Aulas do Módulo */}
              <div style={{
                borderTop: '2px solid #eee',
                paddingTop: '20px',
                marginTop: '20px'
              }}>
                <h3 style={{ color: '#1a1a2e' }}>📹 Aulas do Módulo</h3>
                
                {/* Lista de aulas adicionadas */}
                {newModule.lessons.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                      {newModule.lessons.length} aula(s) adicionada(s)
                    </p>
                    {newModule.lessons.map((lesson, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#e8f5e9',
                        borderRadius: '5px',
                        marginBottom: '5px'
                      }}>
                        <div>
                          <strong>{index + 1}.</strong> {lesson.title}
                          {lesson.is_free_preview && (
                            <span style={{
                              marginLeft: '10px',
                              fontSize: '0.7rem',
                              background: '#27ae60',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              🔓 Preview
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLessonFromList(index)}
                          style={{
                            padding: '4px 10px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário para adicionar aula à lista */}
                <div style={{
                  padding: '15px',
                  background: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>
                    ➕ Adicionar Aula ao Módulo
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}>
                    <input
                      type="text"
                      placeholder="Título da aula"
                      value={currentLesson.title}
                      onChange={(e) => setCurrentLesson({...currentLesson, title: e.target.value})}
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="URL do YouTube"
                      value={currentLesson.youtube_url}
                      onChange={(e) => setCurrentLesson({...currentLesson, youtube_url: e.target.value})}
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Descrição (opcional)"
                      value={currentLesson.description}
                      onChange={(e) => setCurrentLesson({...currentLesson, description: e.target.value})}
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        gridColumn: '1 / -1'
                      }}
                    />
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      gridColumn: '1 / -1',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={currentLesson.is_free_preview}
                        onChange={(e) => setCurrentLesson({...currentLesson, is_free_preview: e.target.checked})}
                      />
                      <span>🔓 Aula gratuita (preview)</span>
                    </label>
                    <button
                      type="button"
                      onClick={addLessonToList}
                      style={{
                        gridColumn: '1 / -1',
                        padding: '10px',
                        background: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      ➕ Adicionar à Lista
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '10px' }}>
                  {newModule.lessons.length} aula(s) adicionada(s) até agora
                </p>
              </div>

              {/* Botões */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                borderTop: '2px solid #eee',
                paddingTop: '20px'
              }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#4a90e2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {editingModule ? '💾 Salvar' : '✅ Criar Módulo com Aulas'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingModule(null);
                    setNewModule({ 
                      title: '', 
                      description: '', 
                      price: '', 
                      is_free: false, 
                      free_lesson_url: '',
                      lessons: []
                    });
                    setCurrentLesson({ title: '', youtube_url: '', description: '', is_free_preview: false });
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}