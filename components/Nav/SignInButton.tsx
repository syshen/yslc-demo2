import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Transition, Text, Paper, Box, Group, Flex, Button, Avatar } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { createClient } from '@/utils/supabase/client';

const scaleY = {
  in: { opacity: 1, transform: 'scaleY(1)' },
  out: { opacity: 0, transform: 'scaleY(0)' },
  common: { transformOrigin: 'top' },
  transitionProperty: 'transform, opacity',
};

export function SignInButton() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  const [opened, setOpened] = useState(false);
  const clickOutsideRef = useClickOutside(() => setOpened(false));
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  });

  return currentUser ? (
    <Group>
        <Box
          w={150}
          pos="relative"
          style={{ display: 'flex', justifyContent: 'end', margin: 'auto' }}
        >
          <Avatar
            autoContrast
            visibleFrom="xs"
            name={currentUser.email}
            color="initials"
            className="cursor-pointer"
            onClick={() => setOpened(!opened)}>
          </Avatar>
          <Transition
            mounted={opened}
            transition={scaleY}
            duration={200}
            timingFunction="ease"
            keepMounted>
            {(transitionStyle) => (
              <Paper
                shadow="md"
                h={120}
                pos="absolute"
                top={40}
                left={0}
                right={0}
                ref={clickOutsideRef}
                style={{ ...transitionStyle, zIndex: 99 }}
              >
                <Flex direction="column" justify="space-evenly" align="begin" h="100%">
                  <Text
                    p="sm"
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => { router.push('/changepassword'); }}
                  >更換密碼
                  </Text>
                  <Text
                    p="sm"
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => { supabase.auth.signOut(); router.push('/'); }}
                  >登出
                  </Text>
                </Flex>
              </Paper>
            )}
          </Transition>
        </Box>
    </Group>
  ) : (
    <div>
      <Group>
        <Link href="/login">
          <Button className="ml-4 md:ml-0" variant="default">登入</Button>
        </Link>
      </Group>
    </div>
  );
}
