// server.js - 방 기반 sessionCache + TTL 기반 stroke 관리

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// ✅ 세션 캐시 Map: 방마다 stroke + 만료 시간 관리
const sessionCache = new Map();
const SESSION_TTL = 10 * 60 * 1000; // 10분

// ⏱ 세션 만료 정리 타이머 (1분마다)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, session] of sessionCache.entries()) {
    if (now > session.expiresAt) {
      sessionCache.delete(roomId);
      console.log(`🧹 세션 만료 → 제거됨: ${roomId}`);
    }
  }
}, 60 * 1000);


// 방 생성
function createSession(roomId) {
  const now = Date.now();
  if (!sessionCache.has(roomId)) {
    sessionCache.set(roomId, {
      strokes: [],
      users: new Map(), // userName 저장
      expiresAt: now + SESSION_TTL
    });
    console.log(`✅ 새 세션 생성: ${roomId}`);
    return true;
  }
  return false;
}


// 🔌 소켓 연결
io.on('connection', (socket) => {
  console.log('🔌 사용자 연결됨');


  // 방 생성
  socket.on('create_room', (roomId) => {
    const created = createSession(roomId);
    socket.emit('room_created', { roomId, created });
    
  });
 
  // 방 참여
  socket.on('join_room', ({ roomId, userName }) => {
    const session = sessionCache.get(roomId);
    if (!session) {
      socket.emit('error', '❌ 세션이 존재하지 않습니다.');
      return;  
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = userName;

    session.users.set(socket.id, userName);
    session.expiresAt = Date.now() + SESSION_TTL;

    // 기존 stroke sync
    socket.emit('stroke_sync', session.strokes);

    // 다른 유저들에게 알림
    socket.to(roomId).emit('user_joined', { userName });

    console.log(`👥 ${userName}님이 ${roomId} 방에 입장`);
  });

  // 커서 이동
  socket.on('cursor_move', ({ x, y }) => {
    const { roomId, userName } = socket;
    if (!roomId || !userName) return;

    socket.to(roomId).emit('cursor_update', { userName, x, y });
  });

  // 오브젝트 추가
  socket.on('object_add', ({ roomId, stroke }) => {
    const session = sessionCache.get(roomId);
    if (session) {
      session.expiresAt = Date.now() + SESSION_TTL;
      session.strokes.push(stroke);
      socket.to(roomId).emit('object_add', stroke);
    }
  });

  // 오브젝트 삭제
  socket.on('object_delete', ({ roomId, strokeId }) => {
    const session = sessionCache.get(roomId);
    if (session) {
      session.expiresAt = Date.now() + SESSION_TTL;
      session.strokes = session.strokes.filter(s => s.id !== strokeId);
      io.to(roomId).emit('object_delete', strokeId);
    }
  });   

  // 사용자 연결 종료
  socket.on('disconnect', () => {
    const { roomId, userName } = socket;
    if (roomId && userName) {
      const session = sessionCache.get(roomId);
      if (session) {
        session.users.delete(socket.id);
        socket.to(roomId).emit('user_left', { userName });
        console.log(`👋 ${userName}님이 ${roomId} 방에서 나감`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 → http://localhost:${PORT}`);
});