'use client';

import { useEffect, useRef, useState } from 'react';

import { MessageCard } from '@/components/workspace/message-card';
import { MessageItem } from '@/types/topic';

export function MessageTimeline({
  messages,
  highlightedMessageId,
}: {
  messages: MessageItem[];
  highlightedMessageId: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !stickToBottom) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [messages, stickToBottom]);

  return (
    <div
      ref={containerRef}
      className="flex min-h-[420px] flex-1 flex-col gap-4 overflow-y-auto pr-1"
      onScroll={(event) => {
        const element = event.currentTarget;
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        setStickToBottom(distanceFromBottom < 80);
      }}
    >
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          highlighted={highlightedMessageId === message.id}
        />
      ))}
    </div>
  );
}
