'use client';

import { useState, useEffect } from 'react';
import {
  MantineProvider,
  Flex,
  Box,
  Divider,
  Textarea,
  ActionIcon,
} from '@mantine/core';
import {
  IconSend,
} from '@tabler/icons-react';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AnalysisPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        console.log(user);
      } else {
        router.push('/login');
      }
    });
  }, []);

  const [prompt, setPrompt] = useState('');

  return (
    <MantineProvider>
      <Flex align="center" direction="row" justify="center" className="h-full">
        <Flex direction="column" className="h-full w-full mx-10 md:w-1/2 md:mx-0">
          <Box className="flex-1 overflow-y-auto p-4">
          </Box>
          <Box>
            <Divider />
            <form className="p-4">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.currentTarget.value)}
                rightSection={<ActionIcon variant="subtle" size="md"><IconSend /></ActionIcon>}
                className="w-full p-2 border rounded"
                placeholder="輸入你想要查詢的資料，例如：今日銷售總合，或者本月暢銷產品"
              />
            </form>
          </Box>
        </Flex>
      </Flex>
    </MantineProvider>
  );
}
