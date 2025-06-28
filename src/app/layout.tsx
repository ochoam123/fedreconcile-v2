import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Your existing font imports
import './globals.css';
import { AuthProvider } from '../context/AuthContext'; // <--- IMPORT AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FedReconcile', // Using your project title
  description: 'AI-Driven Reconciliation for Federal ERP', // Using your project description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider> {/* <--- WRAP children WITH AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}