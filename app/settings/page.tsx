// import { useForm } from '@mantine/form';
import { MantineProvider, Button, Box, Group, TextInput } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default function SettingsPage() {
  const supabase = createClient();
  const user = supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <MantineProvider>
      <Box className="flex justify-center my-10">
        <form className="w-1/3">
          <Box className="grid gap-6">
            <TextInput
              disabled
              label="營業稅率"
              value="0.05"
            />
            <TextInput
              disabled
              label="免運費門檻"
              value="3500"
            />
            <TextInput
              disabled
              label="運費"
              value="150"
            />
            <Group>
              <Button
                disabled
                type="submit"
              >
                儲存
              </Button>
            </Group>
          </Box>
        </form>
      </Box>
    </MantineProvider>
  );
}
