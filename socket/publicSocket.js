const { Server } = require('socket.io');
const { logger, AppError } = require('../common/error/errorHandler');
const { initializeRedis } = require('./redis');
const { registerRoomHandlers } = require('./handlers/roomHandler');
const { registerDrawingHandlers } = require('./handlers/drawingHandler');
const { registerCursorHandlers } = require('./handlers/cursorHandler');
const { instrument } = require("@socket.io/admin-ui");

let io;

function publicSocketConnect(server) {
    // Socket.IO 초기화
    io = new Server(server, {
        cors: {
            origin: '*', // 퍼블릭 서버는 모든 origin 허용
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type']
        },
        path: '/public-socket.io/',
        transports: ['websocket'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Socket.IO Admin UI 설정
    instrument(io, {
        auth: {
            type: "basic",
            username: "admin",
            password: "admin123" // 실제 운영 환경에서는 더 강력한 비밀번호 사용
        },
        mode: "development"
    });
    
    // Redis 초기화
    initializeRedis(io).catch(err => {
        logger.error('Redis 초기화 실패', { error: err.message });
    });

    // 연결 이벤트 처리
    io.on('connection', (socket) => {
        logger.info('새로운 퍼블릭 연결 시도', {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
        
        const roomId = socket.handshake.query.roomId;
        // 이벤트 핸들러 등록
        registerRoomHandlers(socket);
        registerDrawingHandlers(socket);
        registerCursorHandlers(socket);

        // 연결 해제 이벤트
        socket.on('disconnect', () => {
            logger.info('퍼블릭 연결 해제', { 
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
        });
    });

    return io;
}

function getPublicIO() {
    if (!io) {
        throw new Error('퍼블릭 Socket.IO가 초기화되지 않았습니다.');
    }
    return io;
}

function connectToPublicRoom(roomId) {
    if (!io) {
        throw new Error('퍼블릭 Socket.IO가 초기화되지 않았습니다.');
    }
    return io.in(roomId);
}

function disconnectFromPublicRoom(roomId, socketId) {
    if (!io) {
        throw new Error('퍼블릭 Socket.IO가 초기화되지 않았습니다.');
    }
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
        socket.leave(roomId);
    }
}

module.exports = {
    publicSocketConnect,
    getPublicIO,
    connectToPublicRoom,
    disconnectFromPublicRoom
}; 