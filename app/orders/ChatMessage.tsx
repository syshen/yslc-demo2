import {
  Box,
  Group,
  Text,
  Image,
  Flex,
} from '@mantine/core';

export function ChatMessage(
  {
    userName,
    profileUrl,
    message,
}: {
  userName: string;
  profileUrl: string;
  message: string;
}) {
  return (
    <Flex direction="column" py={10} gap="xs">
      <Group gap="xs">
        <Image
          w={20}
          radius="100%"
          src={profileUrl}
        />
        <Text size="xs">{userName}</Text>
      </Group>
      <Box
        bg="#6FDE4B"
        mx={10}
        py={10}
        px={15}
        bd="0 15px 15px 15px"
        style={{ borderRadius: '0 15px 15px 15px' }}
      >
        <pre>{message}</pre>
      </Box>
    </Flex>
  );
}
