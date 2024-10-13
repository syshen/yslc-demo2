'use client';

import React, { useState } from 'react';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import {
  Button,
  Modal,
  Textarea,
  FileInput,
  Stack,
} from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import { Customer } from '@/utils/db';
import { logger, LogAction } from '@/utils/logger';
import { notify } from '@/utils/notify';

// a js code to generate a file name with date and time, like 20240510123000.png
function generateFileName() {
  const date = new Date();
  return `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}.png`;
}

export function CustomerMessageModal(
  { opened, onClose, customers }:
  { opened: boolean,
    onClose: () => void,
    customers: Customer[],
  }
) {
  const supabase = createClient();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const sendMessage = async () => {
    setLoading(true);

    try {
      const payload:
      {
        action: string;
        message: string;
        customers: { customer_id: string, line_id: string }[];
        image?: string;
      } = {
        action: 'broadcast',
        message,
        customers: customers.map((customer) => (
          { customer_id: customer.customer_id, line_id: customer.line_id || '' }
        )).filter((customer: { line_id: string }) => customer.line_id !== ''),
      };
      if (file !== null) {
        const fileName = generateFileName();
        const response = await supabase.storage.from('images').upload(fileName, file);
        if (response.error !== null) {
          throw new Error(response.error.message);
        }
        const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}${response.data.path}`;
        payload.image = imageUrl;
      }
      await notify(payload);
      setLoading(false);
      Notifications.show({
        title: '通知訊息',
        message: '已通知客戶',
        color: 'green',
      });
      logger.info('Send message to customers', {
        action: LogAction.SEND_MESSAGE,
        message,
        customers,
        hasImage: file !== null,
      });
    } catch (error) {
      setLoading(false);
      Notifications.show({
        title: '通知訊息',
        message: '發送失敗',
        color: 'red',
      });
      logger.error(error);
    }
    setFile(null);
    setMessage('');
    if (onClose) {
      onClose();
    }
  };
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="md"
      title="廣播訊息"
      transitionProps={{ duration: 200, transition: 'slide-down' }}
      >
      <Stack>
        <Textarea
          placeholder="輸入訊息"
          label="訊息"
          required
          autosize
          minRows={4}
          value={message}
          onChange={(event) => {
            setMessage(event.currentTarget.value);
          }}
        />
        <FileInput
          placeholder="選擇圖檔"
          label="附加圖檔"
          accept="image/*"
          value={file}
          onChange={setFile}
        />
        <Button
          disabled={message === ''}
          loading={loading}
          onClick={() => {
            sendMessage();
          }}
        >
          發送
        </Button>
      </Stack>
    </Modal>
  );
}
