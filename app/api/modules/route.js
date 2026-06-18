import { query } from '../../../lib/neon.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    let sql = `
      SELECT 
        m.*,
        COUNT(l.id) as lessons_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', l.id,
              'title', l.title,
              'youtube_url', l.youtube_url,
              'description', l.description,
              'is_free_preview', l.is_free_preview,
              'order_number', l.order_number
            )
            ORDER BY l.order_number
          ) FILTER (WHERE l.id IS NOT NULL), 
          '[]'
        ) as lessons
      FROM modules m
      LEFT JOIN lessons l ON m.id = l.module_id
    `;

    const params = [];
    
    if (teacherId) {
      sql += ` WHERE m.teacher_id = $1`;
      params.push(teacherId);
    }

    sql += ` GROUP BY m.id ORDER BY m.created_at DESC`;

    console.log('📡 Buscando módulos...');
    const modules = await query(sql, params);
    console.log(`✅ ${modules.length} módulos encontrados`);
    
    return Response.json(modules);
  } catch (error) {
    console.error('❌ Erro ao listar módulos:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('📡 Recebendo requisição para criar módulo...');
    
    // Buscar a sessão do servidor
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Sessão do servidor:', session);
    console.log('🔍 User da sessão:', session?.user);
    
    if (!session) {
      console.log('❌ Sessão não encontrada');
      return Response.json({ error: 'Não autorizado - Sessão não encontrada' }, { status: 401 });
    }
    
    if (!session.user) {
      console.log('❌ Usuário não encontrado na sessão');
      return Response.json({ error: 'Não autorizado - Usuário não encontrado' }, { status: 401 });
    }
    
    // Verificar o role - USAR session.user.role (NÃO session.role)
    const userRole = session.user.role;
    console.log(`👤 Role do usuário na sessão: ${userRole}`);
    
    if (userRole !== 'teacher') {
      console.log(`❌ Usuário não é professor: ${userRole}`);
      return Response.json({ 
        error: 'Apenas professores podem criar módulos',
        role: userRole 
      }, { status: 401 });
    }

    const data = await request.json();
    console.log('📦 Dados recebidos:', data);
    
    const { title, description, price, is_free, free_lesson_url, teacherId, lessons } = data;

    // Validar dados obrigatórios
    if (!title) {
      return Response.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    // Usar o ID do usuário da sessão
    const teacher_id = teacherId || session.user.id;
    const modulePrice = parseFloat(price) || 0;

    console.log(`👨‍🏫 Criando módulo para professor: ${teacher_id}`);

    // Inserir módulo
    const result = await query(
      `INSERT INTO modules (title, description, price, teacher_id, is_free, free_lesson_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, modulePrice, teacher_id, is_free || false, free_lesson_url || null]
    );

    const newModule = result[0];
    console.log(`✅ Módulo criado com ID: ${newModule.id}`);

    // Se tiver aulas para adicionar
    if (lessons && lessons.length > 0) {
      console.log(`📹 Adicionando ${lessons.length} aulas...`);
      
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const orderNumber = i + 1;
        
        await query(
          `INSERT INTO lessons (module_id, title, youtube_url, description, is_free_preview, order_number)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newModule.id, lesson.title, lesson.youtube_url, lesson.description || '', lesson.is_free_preview || false, orderNumber]
        );
        console.log(`  ✅ Aula ${orderNumber}: ${lesson.title}`);
      }
    }

    // Buscar o módulo completo com as aulas
    const completeModule = await query(
      `SELECT 
        m.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', l.id,
              'title', l.title,
              'youtube_url', l.youtube_url,
              'description', l.description,
              'is_free_preview', l.is_free_preview,
              'order_number', l.order_number
            )
            ORDER BY l.order_number
          ) FILTER (WHERE l.id IS NOT NULL), 
          '[]'
        ) as lessons
      FROM modules m
      LEFT JOIN lessons l ON m.id = l.module_id
      WHERE m.id = $1
      GROUP BY m.id`,
      [newModule.id]
    );

    console.log(`🎉 Módulo criado com sucesso: ${newModule.title}`);
    return Response.json(completeModule[0], { status: 201 });
    
  } catch (error) {
    console.error('❌ Erro ao criar módulo:', error);
    return Response.json({ 
      error: 'Erro ao criar módulo', 
      details: error.message 
    }, { status: 500 });
  }
}