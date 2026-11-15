'use client';

import { Modal } from './Modal';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-app replacement for window.confirm(), styled to match the rest of the UI. */
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancel', danger, onConfirm, onCancel }: Props) {
  return (
    <Modal onClose={onCancel} label={title}>
      <h2 className="text-xl">{title}</h2>
      <p className="mt-3 text-sm text-ink2">{message}</p>
      <div className="mt-6 flex gap-3">
        <button className="btn flex-1" onClick={onCancel} autoFocus>{cancelLabel}</button>
        <button className={`btn flex-1 ${danger ? 'border-bad/60 bg-bad/15 text-bad hover:not-disabled:bg-bad/25' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
