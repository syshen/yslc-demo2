import { Text, PasswordInput } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { SubmitButton } from '../login/SubmitButton';

export default function ChangePassword({ searchParams }: { searchParams: { message: string } }) {
  const changePassword = async (formData: FormData) => {
    'use server';

    // const password = formData.get('password') as string;
    const new_password = formData.get('new_password') as string;
    const confirm_password = formData.get('confirm_password') as string;
    const supabase = createClient();

    if (confirm_password !== new_password) {
      return redirect('/changepassword?message=Password not match');
    }
    const { error } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (error) {
      return redirect('/changepassword?message=Cannot change password');
    }

    return redirect('/orders');
  };

  const supabase = createClient();
  const user = supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mt-24 flex-1 flex flex-row w-full justify-center gap-2">
      <form className="animate-in flex-1 flex flex-col w-full mx-8 sm:max-w-md justify-center gap-2 text-foreground">
        <PasswordInput
          label="現在密碼"
          required
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="Your password"
        />
        <PasswordInput
          label="新密碼"
          required
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="new_password"
          placeholder="New password"
        />
        <PasswordInput
          label="再次輸入新密碼"
          required
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="confirm_password"
          placeholder="Your new password again"
        />
        <Text
          c="red"
          hidden={!searchParams.message || searchParams.message === ''}
        >
            {searchParams.message}
        </Text>
        <SubmitButton
          formAction={changePassword}
          className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2"
          pendingText="密碼更換中..."
        >
          更換密碼
        </SubmitButton>
      </form>
    </div>
  );
}
