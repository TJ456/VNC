export class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
  }

  connect(url, options = {}) {
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        if (options.onOpen) options.onOpen();
      };

      this.ws.onmessage = (event) => {
        if (options.onMessage) options.onMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (options.onClose) options.onClose();
        this.handleReconnect(url, options);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (options.onError) options.onError(error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      if (options.onError) options.onError(error);
    }
  }

  handleReconnect(url, options) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(url, options);
      }, this.reconnectInterval);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}