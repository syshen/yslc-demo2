import Link from 'next/link';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Group, Button, Text } from '@mantine/core';
import { createClient } from '@/utils/supabase/client';

export function SignInButton() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  });

  return currentUser ? (
    <Group visibleFrom="sm">
        <Text>{currentUser.email}</Text>
        <Button variant="default" onClick={() => supabase.auth.signOut()}>登出</Button>
    </Group>
  ) : (
    <div>
      <Group visibleFrom="sm">
        <Link href="/login">
          <Button variant="default">登入</Button>
        </Link>
      </Group>
    </div>
  );
}
