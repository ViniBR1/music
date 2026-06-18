import sql from '../lib/neon.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente do .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Verificar se a DATABASE_URL foi carregada
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env.local!');
  console.error('Verifique se o arquivo .env.local existe e tem a DATABASE_URL');
  process.exit(1);
}

console.log('✅ DATABASE_URL carregada com sucesso!');

async function setupDatabase() {
  console.log('🚀 Criando tabelas no Neon...');

  try {
    // Criar tabela de usuários
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabela users criada');

    // Criar tabela de módulos
    await sql`
      CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        teacher_id UUID REFERENCES users(id),
        is_free BOOLEAN DEFAULT false,
        free_lesson_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabela modules criada');

    // Criar tabela de aulas
    await sql`
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        youtube_url VARCHAR(500) NOT NULL,
        description TEXT,
        is_free_preview BOOLEAN DEFAULT false,
        order_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabela lessons criada');

    // Criar tabela de compras
    await sql`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id),
        module_id UUID REFERENCES modules(id),
        payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabela purchases criada');

    // Inserir usuários de teste
    console.log('👤 Criando usuários...');
    
    const adminHash = await bcrypt.hash('admin123', 10);
    await sql`
      INSERT INTO users (email, password, name, role)
      VALUES ('admin@admin.com', ${adminHash}, 'Administrador', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `;
    console.log('✅ Admin criado');

    const teacherHash = await bcrypt.hash('teacher123', 10);
    await sql`
      INSERT INTO users (email, password, name, role)
      VALUES ('teacher@teacher.com', ${teacherHash}, 'Professor', 'teacher')
      ON CONFLICT (email) DO NOTHING;
    `;
    console.log('✅ Professor criado');

    const studentHash = await bcrypt.hash('student123', 10);
    await sql`
      INSERT INTO users (email, password, name, role)
      VALUES ('student@student.com', ${studentHash}, 'Aluno', 'student')
      ON CONFLICT (email) DO NOTHING;
    `;
    console.log('✅ Aluno criado');

    // Criar módulos de exemplo
    console.log('📚 Criando módulos de exemplo...');
    await sql`
      INSERT INTO modules (title, description, price, free_lesson_url)
      VALUES 
        ('Saindo da Tônica', 
         'Aprenda a criar linhas de baixo saindo da tônica', 
         97.00,
         'https://youtube.com/watch?v=exemplo1'),
        ('Dentro da Tônica', 
         'Domine técnicas de improvisação dentro da tônica', 
         97.00,
         'https://youtube.com/watch?v=exemplo2')
      ON CONFLICT DO NOTHING;
    `;
    console.log('✅ Módulos de exemplo criados');

    console.log('\n🎉 Banco de dados configurado com sucesso!');
    console.log('\n📝 Credenciais de teste:');
    console.log('  👑 Admin:    admin@admin.com / admin123');
    console.log('  👨‍🏫 Professor: teacher@teacher.com / teacher123');
    console.log('  👨‍🎓 Aluno:    student@student.com / student123');
    console.log('\n🚀 Agora rode: npm run dev');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

setupDatabase();