'use client';

import React, { useState } from 'react';
import { Notifications } from '@mantine/notifications';
import {
  Button,
  Modal,
  FileInput,
  Group,
  Stack,
  Text,
  rem,
} from '@mantine/core';
import { IconFileCv } from '@tabler/icons-react';

export function BatchImportButton(
  { label, description, uploadPath, onImport }:
  { label:string, description:string, uploadPath:string, onImport: () => void }
) {
  const [file, setFile] = useState<File | null>();
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const upload = async () => {
    if (!file) {
      return;
    }
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}${uploadPath}`;

      const formData = new FormData();
      formData.append('data', file);
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          // 'Content-Type': 'multipart/form-data',
          JIDOU_API_KEY: `${process.env.NEXT_PUBLIC_BACKEND_AUTH_HEADER}`,
        },
        body: formData,
      });
      if (resp.status !== 200) {
        throw new Error((await resp.json()).reason);
      }
    } catch (error:any) {
      Notifications.show({
        title: '批次匯入失敗',
        message: `請檢查您的檔案格式是否正確: ${error.message}`,
        color: 'red',
        autoClose: 10000,
      });
    }
    setLoading(false);
    setOpened(false);
    if (onImport) {
      onImport();
    }
  };
  return (
    <>
      <Button
        onClick={() => setOpened(true)}
      >{label}
      </Button>
      <Modal
        title="批次匯入"
        opened={opened}
        transitionProps={{ duration: 200, transition: 'slide-down' }}
        onClose={() => setOpened(false)}
      >
        <Stack>
          <Text size="sm">{description}</Text>
          <FileInput
            label="上傳 CSV"
            className="pb-5"
            clearable
            placeholder="請選擇檔案"
            value={file}
            onChange={setFile}
            leftSection={<IconFileCv style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
          />
          <Group>
            <Button
              disabled={file === null}
              loading={loading}
              onClick={upload}
            >上傳
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
