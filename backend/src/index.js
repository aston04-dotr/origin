require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { setupWebSocket } = require('./websocket');
const { apiRouter } = require('./routes');
const paymentsRouter = require('./routes/payments');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);
app.use('/api', paymentsRouter);

app.get('/health', (_, res) => res.json({ ok: true, service: 'boom-backend' }));

setupWebSocket(server);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Shadow Run server http://${HOST}:${PORT}`);
});
