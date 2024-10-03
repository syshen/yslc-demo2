import { Text, TextInput, PasswordInput } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { SubmitButton } from './SubmitButton';

export default function Login({ searchParams }:{ searchParams: { message?: string } }) {
  const { message } = searchParams;

  const signIn = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const m = encodeURIComponent('登入失敗，請檢查帳號密碼');
      return redirect(`/login?message=${m}`);
    }

    return redirect('/orders');
  };

  return (
    <div className="mt-24 flex-1 flex flex-row w-full justify-center gap-2">

      <form className="animate-in flex-1 flex flex-col w-full mx-8 sm:max-w-md justify-center gap-2 text-foreground">
        <TextInput
          label="Email"
          autoComplete="none"
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <PasswordInput
          label="Password"
          required
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="Your password"
        />
        {message && <Text color="red">{message}</Text>}
        <SubmitButton
          formAction={signIn}
          className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2"
          pendingText="登入中..."
        >
          登入
        </SubmitButton>
      </form>
    </div>
  );
}
