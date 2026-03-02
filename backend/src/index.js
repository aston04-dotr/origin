require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { setupWebSocket } = require('./websocket');
const { apiRouter } = require('./routes');
const paymentsRouter = require('./routes/payments');
const activityController = require('./activity/activityController');
const activityScheduler = require('./activity/activityScheduler');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);
app.use('/api', paymentsRouter);
app.use('/api/activity', activityController);

app.get('/health', (_, res) => res.json({ ok: true, service: 'boom-backend' }));

setupWebSocket(server);
activityScheduler.start(server);

const PORT = 3000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log('SERVER IS LIVE AT 0.0.0.0:3000');
});
