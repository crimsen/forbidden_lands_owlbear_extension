/** Kanal zur nativen App (siehe src-tauri/src/bridge.rs im App-Repo). */
export interface BridgeMessage {
  v?: number;
  type: string;
  id?: string;
  [key: string]: unknown;
}

export interface BridgeHandlers {
  onMessage: (message: BridgeMessage) => void;
  onStatus: (connected: boolean) => void;
}

export interface BridgeConnection {
  send: (message: BridgeMessage) => void;
  close: () => void;
}

// Der Kopplungscode kommt aus der Oberfläche (nicht aus dem Quellcode), damit
// eine fremd gehostete Extension den lokalen Server nicht übernehmen kann.
const BRIDGE_URL = "ws://localhost:47823";
const RETRY_MS = 3000;

/** Verbindet mit dem Kopplungscode, meldet Status und verbindet neu. */
export const connectBridge = (
  token: string,
  handlers: BridgeHandlers
): BridgeConnection => {
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const open = () => {
    if (closed) return;
    const ws = new WebSocket(BRIDGE_URL);
    socket = ws;
    ws.onopen = () => ws.send(JSON.stringify({ v: 1, type: "hello", token }));
    ws.onmessage = event => {
      const message = JSON.parse(String(event.data)) as BridgeMessage;
      if (message.type === "ready") handlers.onStatus(true);
      else handlers.onMessage(message);
    };
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      handlers.onStatus(false);
      if (!closed) retry = setTimeout(open, RETRY_MS);
    };
  };

  open();

  return {
    send: message => {
      if (socket?.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify({ v: 1, ...message }));
    },
    close: () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    }
  };
};
