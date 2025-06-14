const { Server } = require('socket.io');
const { logger, AppError } = require('../common/error/errorHandler');
const { verifyJwtToken } = require('../common/error/jwt');
const { initializeRedis } = require('./redis');
const { registerRoomHandlers } = require('./handlers/roomHandler');
const { registerDrawingHandlers } = require('./handlers/drawingHandler');
const { registerCursorHandlers } = require('./handlers/cursorHandler');

let io;

function privateSocketConnect(server) {
    // Socket.IO 초기화
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
        },
        path: '/socket.io',
        transports: ['websocket'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Redis 초기화
    initializeRedis(io).catch(err => {
        logger.error('Redis 초기화 실패', { error: err.message });
    });

    // 연결 이벤트 처리
    io.on('connection', async (socket) => {
        try {
            logger.info('새로운 연결 시도', {
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });

            // 쿠키에서 토큰 추출
            const cookies = socket.handshake.headers.cookie;
            if (!cookies) {
                logger.error('쿠키가 없음', {
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });
                socket.disconnect(true);
                return;
            }

            // access_token 추출
            const accessToken = cookies.split(';')
                .map(c => c.trim())
                .find(c => c.startsWith('access_token='))
                ?.split('=')[1]
                ?.replace(/^"(.*)"$/, '$1'); // 따옴표 제거

            if (!accessToken) {
                logger.error('access_token이 없음', {
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });
                socket.disconnect(true);
                return;
            }

            // 토큰 검증
            const userId = verifyJwtToken(accessToken);
            socket.userId = userId;

            const roomId = socket.handshake.query.roomId;
            logger.info('roomId', {
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });

            // ✅ room 참가
            if (roomId) {
                socket.join(roomId);
                logger.info('방 참가 완료', {
                    socketId: socket.id,
                    roomId: roomId
                });
            } else {
                logger.error('roomId가 없습니다', {
                    socketId: socket.id
                });
            }

            // 이벤트 핸들러 등록
            registerRoomHandlers(socket);
            registerDrawingHandlers(socket);
            registerCursorHandlers(socket);

            // 연결 해제 이벤트
            socket.on('disconnect', () => {
                logger.info('연결 해제', { 
                    socketId: socket.id,
                    userId: socket.userId,
                    roomId: roomId,
                    timestamp: new Date().toISOString()
                });
            });
        } catch (error) {
            logger.error('소켓 연결 처리 실패', {
                socketId: socket.id,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            socket.disconnect(true);
        }
    });

    return io;
}

function getPrivateIO() {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    return io;
}

function connectToPrivateRoom(roomId) {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    return io.in(roomId);
}

function disconnectFromPrivateRoom(roomId, socketId) {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
        socket.leave(roomId);
    }
}

module.exports = {
    privateSocketConnect,
    getPrivateIO,
    connectToPrivateRoom,
    disconnectFromPrivateRoom
}; 