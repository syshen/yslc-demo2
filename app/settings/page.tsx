// import { useForm } from '@mantine/form';
import { MantineProvider, Button, Box, Group, TextInput } from '@mantine/core';

export default function SettingsPage() {
  return (
    <MantineProvider>
      <Box className="flex justify-center my-10">
        <form className="w-1/3">
          <Box className="grid gap-6">
            <TextInput
              label="免運費門檻"
              value="3500"
            />
            <TextInput
              label="運費"
              value="150"
            />
            <Group>
              <Button
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
