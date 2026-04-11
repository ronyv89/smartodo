import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SignupForm from './SignupForm';

export default async function SignupPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user !== null) {
    redirect('/dashboard');
  }

  return (
    <main
      data-testid="signup-page"
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(150deg, #1a1a4e 0%, #5e72e4 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">smarTODO</h1>
          <p className="mt-2 text-blue-100">Create your free account</p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
