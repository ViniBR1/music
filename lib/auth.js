import { query } from './neon.js';
import bcrypt from 'bcryptjs';

export async function verifyCredentials(email, password) {
  try {
    console.log('🔍 Verificando credenciais:', email);
    
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.length === 0) {
      console.log('❌ Usuário não encontrado:', email);
      return null;
    }

    const user = result[0];
    console.log('✅ Usuário encontrado:', user.email);
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Senha válida?', isValid);

    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
}