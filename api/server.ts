import 'dotenv/config';
import app from './app.js';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 3001;

console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('PORT:', PORT);

// Create HTTP server
const server = createServer(app);

// Setup WebSocket Server for Live Sync
const wss = new WebSocketServer({ server, path: '/sync' });

wss.on('connection', (ws) => {
  console.log('[Live Sync] Cliente Web/UE5 conectado.');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      // Broadcast para todos os outros clientes (se UE5 move, atualiza Web; se Web move, atualiza UE5)
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) { // WebSocket.OPEN === 1
          client.send(JSON.stringify(data));
        }
      });
    } catch (e) {
      console.error('[Live Sync] Mensagem inválida recebida:', e);
    }
  });

  ws.on('close', () => {
    console.log('[Live Sync] Cliente desconectado.');
  });
});

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`WebSocket Live Sync ready on ws://localhost:${PORT}/sync`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
