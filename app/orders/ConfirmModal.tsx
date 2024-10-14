import { Modal, ModalProps, Button } from '@mantine/core';

type ConfirmModalProps = {
  onConfirm: () => void,
} & Pick<ModalProps, 'opened' | 'title' | 'onClose'>;

export function ConfirmModal(
  { onConfirm, ...others }:
  ConfirmModalProps
) {
  return (
    <Modal
      {...others}
    >
      <Button onClick={onConfirm}>確認</Button>
    </Modal>
  );
}
