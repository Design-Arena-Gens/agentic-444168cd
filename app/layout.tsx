import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Data Cleaner',
  description: 'L?m s?ch d? li?u th?ng minh v?i AI ?? xu?t quy t?c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="container">
          <header className="header">
            <h1>Smart Data Cleaner</h1>
            <p>L?m s?ch d? li?u th?ng minh (Google AI ?? xu?t)</p>
          </header>
          <main>{children}</main>
          <footer className="footer">? {new Date().getFullYear()} Smart Data Cleaner</footer>
        </div>
      </body>
    </html>
  );
}
