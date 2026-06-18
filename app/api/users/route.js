import { query } from '../../../lib/neon.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route.js';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const users = await query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );

    return Response.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}