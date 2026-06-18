import { query } from '../../../../lib/neon.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';

export async function GET(request, { params }) {
  try {
    console.log('📡 Buscando módulo ID:', params.moduleId);
    
    const { moduleId } = params;

    if (!moduleId) {
      console.log('❌ ID do módulo não fornecido');
      return Response.json({ error: 'ID do módulo não fornecido' }, { status: 400 });
    }

    const result = await query(
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
      [moduleId]
    );

    console.log('📦 Resultado da busca:', result);

    if (result.length === 0) {
      console.log('❌ Módulo não encontrado:', moduleId);
      return Response.json({ error: 'Módulo não encontrado' }, { status: 404 });
    }

    console.log('✅ Módulo encontrado:', result[0].title);
    return Response.json(result[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar módulo:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'teacher') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { moduleId } = params;
    const data = await request.json();
    const { title, description, price, is_free, free_lesson_url } = data;

    const moduleCheck = await query(
      'SELECT * FROM modules WHERE id = $1 AND teacher_id = $2',
      [moduleId, session.user.id]
    );

    if (moduleCheck.length === 0) {
      return Response.json({ error: 'Módulo não encontrado' }, { status: 404 });
    }

    const result = await query(
      `UPDATE modules 
       SET title = $1, description = $2, price = $3, is_free = $4, free_lesson_url = $5
       WHERE id = $6
       RETURNING *`,
      [title, description, price, is_free || false, free_lesson_url || null, moduleId]
    );

    return Response.json(result[0]);
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'teacher') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { moduleId } = params;

    const moduleCheck = await query(
      'SELECT * FROM modules WHERE id = $1 AND teacher_id = $2',
      [moduleId, session.user.id]
    );

    if (moduleCheck.length === 0) {
      return Response.json({ error: 'Módulo não encontrado' }, { status: 404 });
    }

    await query(
      'DELETE FROM modules WHERE id = $1',
      [moduleId]
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar módulo:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}