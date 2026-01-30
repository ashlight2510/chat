const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// HTTP 서버 생성 (WebSocket은 같은 서버에 붙임)
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket 서버
const wss = new WebSocketServer({ server, path: '/ws' });

// 대기 중인 사용자 (매칭 대기)
const waiting = new Set();
// 매칭된 쌍: Map<ws, partnerWs>
const pairs = new Map();

function getOpponent(ws) {
  return pairs.get(ws) || null;
}

function pairUsers(a, b) {
  pairs.set(a, b);
  pairs.set(b, a);
  waiting.delete(a);
  waiting.delete(b);
}

function unpair(ws) {
  const partner = pairs.get(ws);
  if (partner) {
    pairs.delete(ws);
    pairs.delete(partner);
    try {
      if (partner.readyState === 1) {
        partner.send(JSON.stringify({ type: 'partner_left' }));
      }
    } catch (_) {}
  }
}

wss.on('connection', (ws, req) => {
  ws.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'chat') {
        const partner = getOpponent(ws);
        if (partner && partner.readyState === 1) {
          partner.send(JSON.stringify({
            type: 'chat',
            text: (msg.text || '').slice(0, 2000),
            ts: Date.now()
          }));
        }
      } else if (msg.type === 'report') {
        const partner = getOpponent(ws);
        const report = {
          at: new Date().toISOString(),
          reporter: ws.id,
          reported: partner ? partner.id : null,
          reason: msg.reason || '부적절한 대화',
          recentMessages: msg.recentMessages || []
        };
        console.log('[REPORT]', JSON.stringify(report, null, 2));
      }
    } catch (_) {}
  });

  ws.on('close', () => {
    unpair(ws);
    waiting.delete(ws);
  });

  ws.on('error', () => {
    unpair(ws);
    waiting.delete(ws);
  });

  // 즉시 매칭 시도
  if (waiting.size > 0) {
    const partner = waiting.values().next().value;
    pairUsers(ws, partner);
    ws.send(JSON.stringify({ type: 'matched' }));
    partner.send(JSON.stringify({ type: 'matched' }));
  } else {
    waiting.add(ws);
    ws.send(JSON.stringify({ type: 'waiting' }));
  }
});

// ping/pong으로 연결 유지
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      unpair(ws);
      waiting.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));

// HTTP API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    waiting: waiting.size,
    paired: pairs.size / 2
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'Random Chat WebSocket Server',
    version: '1.0.0',
    ws: 'wss://' + (req.headers.host || 'localhost') + '/ws',
    health: '/api/health'
  });
});
