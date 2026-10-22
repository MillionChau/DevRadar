/**
 * DevRadar Realtime SignalR Helper
 * Quản lý kết nối WebSocket xuyên qua YARP Gateway
 */

type SignalRMessageHandler = (data: any) => void;

class SignalRService {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, SignalRMessageHandler[]> = new Map();
  private reconnectInterval = 5000;
  private isIntentionalClose = false;

  constructor(hubPath: string = '/community/hubs/community') {
    const gatewayHost = (import.meta as any).env?.VITE_GATEWAY_WS_URL || 'ws://localhost:5000';
    this.url = `${gatewayHost}${hubPath}`;
  }

  public connect() {
    const token = localStorage.getItem('devradar_access_token');
    const connectUrl = token ? `${this.url}?access_token=${token}` : this.url;

    try {
      this.ws = new WebSocket(connectUrl);

      this.ws.onopen = () => {
        // Gửi handshake protocol của SignalR Json
        this.ws?.send(JSON.stringify({ protocol: 'json', version: 1 }) + '\x1e');
      };

      this.ws.onmessage = (event) => {
        try {
          const messages = event.data.split('\x1e').filter(Boolean);
          for (const msg of messages) {
            const parsed = JSON.parse(msg);
            if (parsed.type === 1 && parsed.target) {
              const callbacks = this.handlers.get(parsed.target);
              callbacks?.forEach((cb) => cb(parsed.arguments?.[0]));
            }
          }
        } catch {
          // Ignore ping or non-json frame
        }
      };

      this.ws.onclose = () => {
        if (!this.isIntentionalClose) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };
    } catch {
      // WebSocket gracefully degraded if backend offline
    }
  }

  public on(target: string, handler: SignalRMessageHandler) {
    if (!this.handlers.has(target)) {
      this.handlers.set(target, []);
    }
    this.handlers.get(target)!.push(handler);
  }

  public off(target: string, handler: SignalRMessageHandler) {
    const callbacks = this.handlers.get(target);
    if (callbacks) {
      this.handlers.set(
        target,
        callbacks.filter((cb) => cb !== handler)
      );
    }
  }

  public disconnect() {
    this.isIntentionalClose = true;
    this.ws?.close();
  }
}

export const communityHub = new SignalRService('/community/hubs/community');
export const notificationHub = new SignalRService('/notification/hubs/notifications');
