import { query } from '../../../lib/neon.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route.js';

// GET - Listar aulas ao vivo
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');

    let sql = `
      SELECT 
        lc.*,
        u.name as teacher_name,
        u.email as teacher_email,
        m.title as module_title
      FROM live_classes lc
      JOIN users u ON lc.teacher_id = u.id
      LEFT JOIN modules m ON lc.module_id = m.id
    `;

    const params = [];
    
    if (teacherId) {
      sql += ` WHERE lc.teacher_id = $1`;
      params.push(teacherId);
    } else if (studentId) {
      sql += `
        WHERE lc.status IN ('scheduled', 'ongoing')
        AND lc.module_id IN (
          SELECT module_id FROM purchases 
          WHERE student_id = $1 AND status = 'approved'
        )
      `;
      params.push(studentId);
    }

    sql += ` ORDER BY lc.start_time ASC`;

    const classes = await query(sql, params);
    
    return Response.json(classes);
  } catch (error) {
    console.error('Erro ao listar aulas ao vivo:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar aula ao vivo
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'teacher') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, module_id, start_time, end_time, meeting_url } = data;

    // Validar dados
    if (!title || !start_time) {
      return Response.json({ error: 'Título e data/hora são obrigatórios' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO live_classes (teacher_id, title, description, module_id, start_time, end_time, meeting_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
       RETURNING *`,
      [session.user.id, title, description, module_id || null, start_time, end_time || null, meeting_url || null]
    );

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar aula ao vivo:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}