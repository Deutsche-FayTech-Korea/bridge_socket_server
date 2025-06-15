const { Server } = require('socket.io');
const { logger, AppError } = require('../common/error/errorHandler');
const { verifyJwtToken } = require('../common/error/jwt');
const { initializeRedis } = require('./redis');
const { registerRoomHandlers } = require('./handlers/roomHandler');
const { registerDrawingHandlers } = require('./handlers/drawingHandler');
const { registerCursorHandlers } = require('./handlers/cursorHandler');
const { instrument } = require("@socket.io/admin-ui");

let io;

function privateSocketConnect(server) {
    // Socket.IO 초기화
    io = new Server(server, {
        cors: {
            origin: [
                process.env.CLIENT_URL || 'http://localhost:3000',
                'https://admin.socket.io', // 공식 Admin UI 주소
            ],
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
        },
        path: '/socket.io',
        transports: ['websocket'],
        allowEIO3: true,
        pingTimeout: 30000,
        pingInterval: 15000,
        maxHttpBufferSize: 1e6,
        connectTimeout: 45000,
        upgradeTimeout: 30000
    });

    // Admin UI 미들웨어 적용
    instrument(io, {
        auth: false,
        mode: "development",
        namespaceName: "/admin",
        serverId: "admin-server"
    });

    // Redis 초기화
    initializeRedis(io).catch(err => {
        logger.error('Redis 초기화 실패', { error: err.message });
    });

    // 연결 이벤트 처리
    io.on('connection', async (socket) => {
        // Admin UI 인증 확인
        logger.info('소켓 연결 시도', {
            socketId: socket.id,
            auth: socket.handshake.auth,
            headers: socket.handshake.headers
        });

        const isAdmin = socket.handshake.auth && 
                       socket.handshake.auth.username === 'admin' && 
                       socket.handshake.auth.password === 'admin123';

        logger.info('Admin 인증 결과', {
            socketId: socket.id,
            isAdmin: isAdmin,
            authData: socket.handshake.auth
        });

        if (isAdmin) {
            socket.data.isAdmin = true;
            logger.info('Admin UI가 연결되었습니다.', { socketId: socket.id });
            return;
        }

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