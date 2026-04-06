import { EventEmitter } from "node:events";

export type EventPayload = {
  type: string;
  projectId?: string;
  cardId?: string;
  [key: string]: unknown;
};

class EventBus extends EventEmitter {
  emitEvent(payload: EventPayload): void {
    this.emit("event", payload);
  }

  onEvent(callback: (payload: EventPayload) => void): () => void {
    this.on("event", callback);
    return () => {
      this.off("event", callback);
    };
  }
}

export const eventBus = new EventBus();
