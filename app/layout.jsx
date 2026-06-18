import Providers from './providers';

export const metadata = {
  title: 'Curso de Contrabaixo',
  description: 'Aprenda contrabaixo com os melhores professores',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f0f2f5' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}