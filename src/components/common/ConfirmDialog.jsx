import { Trash2, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { cn } from '../../utils/cn';

const ICONS = {
  delete: { Icon: Trash2, tile: 'bg-rose-50 text-rose-600' },
  warning: { Icon: AlertCircle, tile: 'bg-amber-50 text-amber-600' },
};

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm action',
  description,
  variant = 'delete',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
}) {
  const { Icon, tile } = ICONS[variant] || ICONS.delete;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} className="max-w-md">
      <div className="flex items-start gap-4">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tile)}>
          <Icon className="h-5 w-5" />
        </span>
        {description && (
          <p className="min-w-0 flex-1 pt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
