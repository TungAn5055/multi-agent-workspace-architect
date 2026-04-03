'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { formatRelativeDate } from '@/lib/format';
import { MessageItem } from '@/types/topic';

export function MessageCard({
  message,
  highlighted = false,
}: {
  message: MessageItem;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSystem = message.senderType === 'system';
  const isHuman = message.senderType === 'human';
  const isLong = message.contentMarkdown.length > 720;
  const visibleContent = useMemo(() => {
    if (!isLong || expanded) {
      return message.contentMarkdown;
    }

    return `${message.contentMarkdown.slice(0, 720)}...`;
  }, [expanded, isLong, message.contentMarkdown]);

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-2xl rounded-full border border-line/15 bg-white/[0.03] px-4 py-2 text-xs text-mist">
          {message.contentMarkdown}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isHuman ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`w-full ${isHuman ? 'max-w-[72%]' : 'max-w-[88%]'} ${
          highlighted ? 'rounded-[26px] ring-2 ring-warning/30' : ''
        }`}
      >
        {!isHuman ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
            <p className="text-sm font-medium text-ink">{message.senderName}</p>
            <span className="text-xs text-mist">{formatRelativeDate(message.createdAt)}</span>
            {message.status === 'streaming' ? (
              <span className="inline-flex items-center gap-2 text-xs text-accent">
                <Spinner className="h-3.5 w-3.5" />
                Đang stream
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className={`rounded-[24px] px-5 py-4 ${
            isHuman
              ? 'bg-black/30 text-ink shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
              : 'border border-line/15 bg-white/[0.03] text-ink'
          }`}
        >
          <div className="prose prose-invert max-w-none text-[15px] leading-7 prose-p:text-ink prose-headings:text-white prose-strong:text-white prose-a:text-accent prose-li:text-ink">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{visibleContent || '...'}</ReactMarkdown>
          </div>

          {isLong ? (
            <button
              className="mt-2 text-xs font-medium text-accent"
              type="button"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? 'Thu gọn' : 'Xem toàn bộ'}
            </button>
          ) : null}

          {message.mentions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.mentions.map((mention) => (
                <Badge key={`${message.id}-${mention.agentId}`} tone="accent">
                  @{mention.agentName}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
