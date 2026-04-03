'use client';

import { useState } from 'react';

import { Textarea } from '@/components/ui/textarea';

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
    <div className="rounded-[26px] border border-line/20 bg-[#2a2a28] px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
      <div className="flex items-end gap-3">
        <Textarea
          value={value}
          className="min-h-[70px] flex-1 resize-none border-none bg-transparent px-0 py-1 text-[15px] leading-7 focus:bg-transparent"
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

        <div className="mb-1 flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Gửi message"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#5a54ff] text-white shadow-[0_10px_24px_rgba(90,84,255,0.28)] transition hover:bg-[#6c67ff] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={disabled || archived || !value.trim() || loading}
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
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h12" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
