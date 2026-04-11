import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user !== null) {
    redirect('/dashboard');
  }

  return (
    <main
      data-testid="login-page"
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(150deg, #1a1a4e 0%, #5e72e4 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">smarTODO</h1>
          <p className="mt-2 text-blue-100">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
