import { query } from '../../../../lib/neon.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';

// GET - Buscar aula específica
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await query(
      `SELECT 
        lc.*,
        u.name as teacher_name,
        u.email as teacher_email,
        m.title as module_title
       FROM live_classes lc
       JOIN users u ON lc.teacher_id = u.id
       LEFT JOIN modules m ON lc.module_id = m.id
       WHERE lc.id = $1`,
      [id]
    );

    if (result.length === 0) {
      return Response.json({ error: 'Aula não encontrada' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar aula
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'teacher') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();
    const { title, description, start_time, end_time, meeting_url, status } = data;

    // Verificar se a aula pertence ao professor
    const check = await query(
      'SELECT * FROM live_classes WHERE id = $1 AND teacher_id = $2',
      [id, session.user.id]
    );

    if (check.length === 0) {
      return Response.json({ error: 'Aula não encontrada' }, { status: 404 });
    }

    const result = await query(
      `UPDATE live_classes 
       SET title = $1, description = $2, start_time = $3, end_time = $4, 
           meeting_url = $5, status = $6
       WHERE id = $7
       RETURNING *`,
      [title, description, start_time, end_time, meeting_url, status, id]
    );

    return Response.json(result[0]);
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Cancelar aula
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'teacher') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Verificar se a aula pertence ao professor
    const check = await query(
      'SELECT * FROM live_classes WHERE id = $1 AND teacher_id = $2',
      [id, session.user.id]
    );

    if (check.length === 0) {
      return Response.json({ error: 'Aula não encontrada' }, { status: 404 });
    }

    await query(
      'DELETE FROM live_classes WHERE id = $1',
      [id]
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar aula:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}