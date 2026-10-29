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
async function verifySupabaseUser(req) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return { user: null, error: 'Missing authorization token.' };
  }

  const { data, error } = await supabase.auth.getUser(match[1]);

  if (error || !data?.user) {
    return { user: null, error: 'Invalid or expired session.' };
  }

  return { user: data.user, error: null };
}
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
  
  if (pathname === '/api/room-activity/start' && req.method === 'POST') {
    const { user, error: authError } = await verifySupabaseUser(req);

    if (authError || !user) {
      res.writeHead(401);
      return res.end(JSON.stringify({
        error: 'Please sign in to track room activity.'
      }));
    }

    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10_000) req.destroy();
    });

    req.on('end', async () => {
      try {
        const { roomId } = JSON.parse(body || '{}');

        if (
          typeof roomId !== 'string' ||
          !roomId.trim() ||
          roomId.length > 100
        ) {
          res.writeHead(400);
          return res.end(JSON.stringify({
            error: 'Valid roomId is required.'
          }));
        }

        const { data: existing, error: lookupError } = await supabase
          .from('room_activity_sessions')
          .select('id')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .is('ended_at', null)
          .maybeSingle();

        if (lookupError) throw lookupError;

        if (existing) {
          res.writeHead(200);
          return res.end(JSON.stringify({
            ok: true,
            message: 'Room activity session already active.'
          }));
        }

        const { error: insertError } = await supabase
          .from('room_activity_sessions')
          .insert({
            room_id: roomId,
            user_id: user.id
          });

        if (insertError) throw insertError;

        res.writeHead(200);
        return res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        console.error('Room activity start error:', error.message);
        res.writeHead(500);
        return res.end(JSON.stringify({
          error: 'Could not start room activity.'
        }));
      }
    });

    return;
  }

  if (pathname === '/api/room-activity/award' && req.method === 'POST') {
    const { user, error: authError } = await verifySupabaseUser(req);

    if (authError || !user) {
      res.writeHead(401);
      return res.end(JSON.stringify({
        error: 'Please sign in to earn room XP.'
      }));
    }

    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10_000) req.destroy();
    });

    req.on('end', async () => {
      try {
        const { roomId } = JSON.parse(body || '{}');

        if (
          typeof roomId !== 'string' ||
          !roomId.trim() ||
          roomId.length > 100
        ) {
          res.writeHead(400);
          return res.end(JSON.stringify({
            error: 'Valid roomId is required.'
          }));
        }

        const { data, error } = await supabase.rpc(
          'award_room_activity_xp',
          {
            p_room_id: roomId,
            p_user_id: user.id
          }
        );

        if (error) {
          console.error('Room XP award error:', JSON.stringify({
  message: error.message,
  code: error.code,
  details: error.details,
  hint: error.hint
}));
          res.writeHead(400);
          return res.end(JSON.stringify({
            error: 'No eligible active session or XP could not be awarded.'
          }));
        }

        const result = data?.[0] || {};

        res.writeHead(200);
        return res.end(JSON.stringify({
          ok: true,
          awardedXp: Number(result.awarded_xp || 0),
          roomXp: Number(result.total_room_xp || 0)
        }));
      } catch (error) {
        console.error('Room XP request error:', error.message);
        res.writeHead(400);
        return res.end(JSON.stringify({
          error: 'Invalid room XP request.'
        }));
      }
    });

    return;
  }


  if (pathname === '/api/room-activity/end' && req.method === 'POST') {
    const { user, error: authError } = await verifySupabaseUser(req);

    if (authError || !user) {
      res.writeHead(401);
      return res.end(JSON.stringify({
        error: 'Please sign in to end room activity.'
      }));
    }

    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10_000) req.destroy();
    });

    req.on('end', async () => {
      try {
        const { roomId } = JSON.parse(body || '{}');

        if (
          typeof roomId !== 'string' ||
          !roomId.trim() ||
          roomId.length > 100
        ) {
          res.writeHead(400);
          return res.end(JSON.stringify({
            error: 'Valid roomId is required.'
          }));
        }

        const { error } = await supabase
          .from('room_activity_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .is('ended_at', null);

        if (error) throw error;

        res.writeHead(200);
        return res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        console.error('Room activity end error:', error.message);
        res.writeHead(500);
        return res.end(JSON.stringify({
          error: 'Could not end room activity.'
        }));
      }
    });

    return;
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
        micCount: data?.mic_count ?? 10
      }));
    } catch (error) {
      console.error('Room progress API error:', error.message);
      res.writeHead(500);
      return res.end(JSON.stringify({ error: 'Server error loading room progress.' }));
    }
  }

  if (pathname === '/api/rooms' && req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('shared_rooms')
        .select('rooms')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      const rooms = data?.rooms ?? sharedRooms;
      sharedRooms = rooms;

      res.writeHead(200);
      return res.end(JSON.stringify({ rooms }));
    } catch (error) {
      console.error('Load shared rooms error:', error.message);
      res.writeHead(500);
      return res.end(JSON.stringify({ error: 'Could not load rooms.' }));
    }
  }

  if (pathname === '/api/rooms' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100_000) req.destroy();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');

        if (!Array.isArray(data.rooms)) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Rooms must be a list.' }));
        }

        const { error } = await supabase
          .from('shared_rooms')
          .upsert(
            {
              id: 1,
              rooms: data.rooms,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'id' }
          );

        if (error) throw error;

        sharedRooms = data.rooms;

        res.writeHead(200);
        return res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        console.error('Save shared rooms error:', error.message);
        res.writeHead(500);
        return res.end(JSON.stringify({ error: 'Could not save rooms.' }));
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
      const { user, error: authError } = await verifySupabaseUser(req);

if (authError || !user) {
  res.writeHead(401);
  return res.end(JSON.stringify({
    error: 'Please sign in to join a voice room.'
  }));
}
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
