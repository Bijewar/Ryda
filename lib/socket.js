// lib/socket.js
export function createSocket(url, onMessage, onReconnect) {
  let socket = null;
  let reconnectTimer = null;

  const connect = () => {
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      if (onReconnect) onReconnect(); // reconnect hone ke baad ride restore
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error("❌ Invalid WS message", e);
      }
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket closed, retrying...");
      reconnectTimer = setTimeout(connect, 3000); // retry after 3 sec
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket error", err);
      socket?.close();
    };
  };

  connect();

  return {
    send: (msg) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
      }
    },
    close: () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
}
