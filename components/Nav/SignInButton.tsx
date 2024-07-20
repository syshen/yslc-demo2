import Link from 'next/link';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Group, Button, Avatar } from '@mantine/core';
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
    <Group>
        <Avatar
          autoContrast
          visibleFrom="xs"
          name={currentUser.email}
          color="initials">
        </Avatar>
        <Button className="ml-4 md:ml-0" variant="default" onClick={() => supabase.auth.signOut()}>登出</Button>
    </Group>
  ) : (
    <div>
      <Group>
        <Avatar
          visibleFrom="xs"
          autoContrast
          src={null}
        >
        </Avatar>
        <Link href="/login">
          <Button className="ml-4 md:ml-0" variant="default">登入</Button>
        </Link>
      </Group>
    </div>
  );
}
