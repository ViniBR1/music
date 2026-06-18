import { query } from '../../../../lib/neon.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'teacher') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return Response.json({ error: 'ID do professor não fornecido' }, { status: 400 });
    }

    const students = await query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        m.title as module_title,
        p.created_at as purchase_date
       FROM purchases p
       JOIN users u ON p.student_id = u.id
       JOIN modules m ON p.module_id = m.id
       WHERE m.teacher_id = $1 AND p.status = 'approved'
       ORDER BY p.created_at DESC`,
      [teacherId]
    );

    return Response.json(students);
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}