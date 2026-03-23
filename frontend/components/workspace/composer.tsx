'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RunStatus } from '@/types/topic';

export function Composer({
  disabled,
  waitingHuman,
  archived,
  onSend,
}: {
  disabled: boolean;
  waitingHuman: boolean;
  archived: boolean;
  onSend: (content: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const placeholder = archived
    ? 'Topic đã archive nên không thể gửi thêm message.'
    : waitingHuman
      ? 'Lead đang chờ bạn trả lời. Nhập phản hồi để tiếp tục topic...'
      : 'Nhập câu hỏi hoặc chỉ định agent bằng cú pháp @TênAgent...';

  return (
    <div className="rounded-[28px] border border-line/20 bg-panel/90 p-4 shadow-panel">
      <Textarea
        value={value}
        className="min-h-[120px] resize-none border-none bg-transparent px-0 py-0 focus:bg-transparent"
        placeholder={placeholder}
        disabled={disabled || archived || loading}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={async (event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!value.trim() || disabled || archived || loading) {
              return;
            }
            setLoading(true);
            try {
              await onSend(value.trim());
              setValue('');
            } finally {
              setLoading(false);
            }
          }
        }}
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-mist">
          {waitingHuman
            ? 'Run trước đang chờ bạn. Phản hồi mới sẽ khởi động lượt tiếp theo.'
            : 'Enter để gửi, Shift + Enter để xuống dòng.'}
        </p>
        <Button
          loading={loading}
          disabled={disabled || archived || !value.trim()}
          onClick={async () => {
            if (!value.trim()) {
              return;
            }
            setLoading(true);
            try {
              await onSend(value.trim());
              setValue('');
            } finally {
              setLoading(false);
            }
          }}
        >
          Gửi message
        </Button>
      </div>
    </div>
  );
}
