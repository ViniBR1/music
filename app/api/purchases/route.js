import { query } from '../../../lib/neon.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return Response.json({ error: 'ID do aluno não fornecido' }, { status: 400 });
    }

    const purchases = await query(
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
       FROM purchases p 
       JOIN modules m ON p.module_id = m.id 
       LEFT JOIN lessons l ON m.id = l.module_id
       WHERE p.student_id = $1 AND p.status = 'approved'
       GROUP BY m.id
       ORDER BY p.created_at DESC`,
      [studentId]
    );

    return Response.json(purchases);
  } catch (error) {
    console.error('Erro ao listar compras:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}