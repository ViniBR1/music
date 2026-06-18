import { query } from '../../../../lib/neon.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route.js';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'teacher') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { moduleId } = params;
    const data = await request.json();
    const { title, youtube_url, description, is_free_preview } = data;

    const moduleCheck = await query(
      'SELECT * FROM modules WHERE id = $1 AND teacher_id = $2',
      [moduleId, session.user.id]
    );

    if (moduleCheck.length === 0) {
      return Response.json({ error: 'Módulo não encontrado' }, { status: 404 });
    }

    const lessonsCount = await query(
      'SELECT COUNT(*) FROM lessons WHERE module_id = $1',
      [moduleId]
    );

    const orderNumber = parseInt(lessonsCount[0].count) + 1;

    const result = await query(
      `INSERT INTO lessons (module_id, title, youtube_url, description, is_free_preview, order_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [moduleId, title, youtube_url, description, is_free_preview || false, orderNumber]
    );

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar aula:', error);
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
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return Response.json({ error: 'ID da aula não fornecido' }, { status: 400 });
    }

    const moduleCheck = await query(
      'SELECT * FROM modules WHERE id = $1 AND teacher_id = $2',
      [moduleId, session.user.id]
    );

    if (moduleCheck.length === 0) {
      return Response.json({ error: 'Módulo não encontrado' }, { status: 404 });
    }

    await query(
      'DELETE FROM lessons WHERE id = $1 AND module_id = $2',
      [lessonId, moduleId]
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}