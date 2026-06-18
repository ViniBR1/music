import { query } from '../../../lib/neon.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route.js';

// Por enquanto, vamos simular o pagamento
// Depois vamos integrar com Mercado Pago

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { moduleId, studentId } = data;

    // Verificar se o módulo existe
    const moduleCheck = await query(
      'SELECT * FROM modules WHERE id = $1',
      [moduleId]
    );

    if (moduleCheck.length === 0) {
      return Response.json({ error: 'Módulo não encontrado' }, { status: 404 });
    }

    // Verificar se já comprou
    const existingPurchase = await query(
      'SELECT * FROM purchases WHERE student_id = $1 AND module_id = $2 AND status = $3',
      [studentId || session.user.id, moduleId, 'approved']
    );

    if (existingPurchase.length > 0) {
      return Response.json({ error: 'Você já comprou este módulo' }, { status: 400 });
    }

    // Simular pagamento aprovado (depois vamos integrar com Mercado Pago)
    // Aqui simulamos que o pagamento foi aprovado
    const paymentId = `sim_${Date.now()}`;
    
    await query(
      `INSERT INTO purchases (student_id, module_id, payment_id, status)
       VALUES ($1, $2, $3, $4)`,
      [studentId || session.user.id, moduleId, paymentId, 'approved']
    );

    return Response.json({ 
      success: true, 
      message: 'Compra simulada com sucesso!',
      preferenceId: 'simulacao' 
    });

  } catch (error) {
    console.error('Erro no pagamento:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}