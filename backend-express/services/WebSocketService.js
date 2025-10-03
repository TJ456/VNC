class WebSocketService {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Set();
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }
  
  broadcast(message) {
    const messageString = JSON.stringify(message);
    const disconnectedClients = [];
    
    this.clients.forEach((client) => {
      try {
        if (client.readyState === client.OPEN) {
          client.send(messageString);
        } else {
          disconnectedClients.push(client);
        }
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        disconnectedClients.push(client);
      }
    });
    
    // Clean up disconnected clients
    disconnectedClients.forEach((client) => {
      this.clients.delete(client);
    });
  }
  
  sendToClient(client, message) {
    try {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error sending message to client:', error);
      this.clients.delete(client);
    }
  }
  
  handleMessage(client, data) {
    // Handle incoming messages from clients
    switch (data.type) {
      case 'ping':
        this.sendToClient(client, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      case 'subscribe':
        // Handle subscription to specific events
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }
  
  getConnectedClientsCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketService;