import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, interval, map } from 'rxjs';

import { AppConfigService } from 'src/config/app-config.service';

interface TopicEvent {
  type: string;
  data: Record<string, unknown>;
}

@Injectable()
export class StreamService {
  private readonly streams = new Map<string, Subject<TopicEvent>>();

  constructor(private readonly appConfig: AppConfigService) {}

  stream(topicId: string): Observable<MessageEvent> {
    const topicStream = this.getTopicStream(topicId);

    return new Observable<MessageEvent>((subscriber) => {
      subscriber.next({
        type: 'connected',
        data: {
          topicId,
          connectedAt: new Date().toISOString(),
        },
      });

      const topicSubscription = topicStream.subscribe((event) => {
        subscriber.next({
          type: event.type,
          data: event.data,
        });
      });

      const heartbeatSubscription = interval(this.appConfig.sseHeartbeatMs)
        .pipe(
          map(() => ({
            type: 'ping',
            data: {
              topicId,
              timestamp: new Date().toISOString(),
            },
          })),
        )
        .subscribe((event) => subscriber.next(event));

      return () => {
        topicSubscription.unsubscribe();
        heartbeatSubscription.unsubscribe();
      };
    });
  }

  publish(topicId: string, eventName: string, data: Record<string, unknown>) {
    this.getTopicStream(topicId).next({
      type: eventName,
      data,
    });
  }

  private getTopicStream(topicId: string) {
    if (!this.streams.has(topicId)) {
      this.streams.set(topicId, new Subject<TopicEvent>());
    }

    return this.streams.get(topicId)!;
  }
}
