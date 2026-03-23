'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
        <div className="max-w-2xl rounded-full border border-line/20 bg-white/[0.04] px-4 py-2 text-xs text-mist">
          {message.contentMarkdown}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isHuman ? 'justify-end' : 'justify-start'}`}>
      <Card
        className={`max-w-3xl p-4 ${isHuman ? 'bg-accent/10 ring-1 ring-accent/20' : 'bg-panel/90'} ${
          highlighted ? 'ring-2 ring-warning/40' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <Avatar name={message.senderName} tone={isHuman ? 'human' : 'agent'} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-ink">{message.senderName}</p>
              <span className="text-xs text-mist">{formatRelativeDate(message.createdAt)}</span>
              {message.status === 'streaming' ? (
                <span className="inline-flex items-center gap-2 text-xs text-accent">
                  <Spinner className="h-3.5 w-3.5" />
                  Đang stream
                </span>
              ) : null}
            </div>

            <div className="prose prose-invert mt-3 max-w-none text-sm leading-7 prose-p:text-ink prose-headings:text-white prose-strong:text-white prose-a:text-accent prose-li:text-ink">
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
      </Card>
    </div>
  );
}
