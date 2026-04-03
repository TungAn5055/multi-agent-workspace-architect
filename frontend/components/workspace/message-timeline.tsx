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

  function scrollToBottom() {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }

  useEffect(() => {
    if (!stickToBottom) {
      return;
    }

    const frameId = window.requestAnimationFrame(scrollToBottom);
    return () => window.cancelAnimationFrame(frameId);
  }, [messages, stickToBottom]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (stickToBottom) {
        scrollToBottom();
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [stickToBottom]);

  return (
    <div
      ref={containerRef}
      className="chat-scrollbar flex h-full min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2"
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
