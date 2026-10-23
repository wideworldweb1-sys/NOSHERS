import 'dotenv/config';
import http from 'node:http';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';
const PORT = Number(process.env.PORT || 3001);
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
let sharedRooms = [];
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
  console.log('REQUEST RECEIVED:', req.method, JSON.stringify(req.url));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  console.log('DEBUG ROUTE CHECK:', req.method, JSON.stringify(req.url), req.url === '/debug');
  if (pathname === '/debug') {
  res.writeHead(200);
  return res.end(JSON.stringify({
    path: req.url,
    method: req.method,
    service: 'noshers-server'
  }));
}
  
  if (pathname === '/api/room-progress' && req.method === 'GET') {
    const roomId = new URL(req.url, 'http://localhost').searchParams.get('roomId');

    if (!roomId || roomId.length > 100) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: 'Valid roomId is required.' }));
    }

    try {
      const { data, error } = await supabase
        .from('room_progress')
        .select('room_id, room_xp, room_level, mic_count')
        .eq('room_id', roomId)
        .maybeSingle();

      if (error) {
        console.error('Room progress read error:', error.message);
        res.writeHead(500);
        return res.end(JSON.stringify({ error: 'Could not load room progress.' }));
      }

      res.writeHead(200);
      return res.end(JSON.stringify({
        roomId,
        roomXp: data?.room_xp ?? 0,
        roomLevel: data?.room_level ?? 1,
        micCount: data?.mic_count ?? 5
      }));
    } catch (error) {
      console.error('Room progress API error:', error.message);
      res.writeHead(500);
      return res.end(JSON.stringify({ error: 'Server error loading room progress.' }));
    }
  }

  if (pathname === '/api/rooms' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({ rooms: sharedRooms }));
  }
  if (pathname === '/api/rooms' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100_000) req.destroy();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');

        if (!Array.isArray(data.rooms)) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Rooms must be a list.' }));
        }

        sharedRooms = data.rooms;
        res.writeHead(200);
        return res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Invalid JSON.' }));
      }
    });

    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200); return res.end(JSON.stringify({ ok: true, service: 'noshers-token-server' }));
  }
  if (req.url !== '/api/livekit/token' || req.method !== 'POST') {
    res.writeHead(404); return res.end(JSON.stringify({ error: 'Not found' }));
  }
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    res.writeHead(503); return res.end(JSON.stringify({ error: 'LiveKit credentials are not configured on the server.' }));
  }

  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > 10_000) req.destroy(); });
  req.on('end', async () => {
    try {
      const { roomName, participantName } = JSON.parse(body || '{}');
      if (typeof roomName !== 'string' || !roomName.trim() || roomName.length > 100 ||
          typeof participantName !== 'string' || !participantName.trim() || participantName.length > 80) {
        res.writeHead(400); return res.end(JSON.stringify({ error: 'Valid roomName and participantName are required.' }));
      }
      // IMPORTANT: Production must authenticate the caller and authorize speaker/host roles here.
      const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: `${participantName.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'guest'}-${crypto.randomUUID().slice(0, 8)}`,
        name: participantName.trim(),
        ttl: '15m'
      });
      token.addGrant({ roomJoin: true, room: roomName.trim(), canPublish: true, canSubscribe: true });
      const jwt = await token.toJwt();
      res.writeHead(200); res.end(JSON.stringify({ token: jwt, url: process.env.LIVEKIT_URL }));
    } catch {
      res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid request.' }));
    }
  });
});

server.listen(PORT, () => console.log(`NOSHERS token server listening on ${PORT}`));
