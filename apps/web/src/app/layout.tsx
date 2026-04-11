import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'smarTODO — AI-Powered Task Management',
  description:
    'Open-source, plugin-extensible task management with AI-powered intelligence. Self-hostable with Supabase.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
