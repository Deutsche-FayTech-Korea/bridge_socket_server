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
            origin: [
                process.env.CLIENT_URL || 'http://localhost:3000',
                'https://admin.socket.io', // 공식 Admin UI 주소
            ],
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
        },
        path: '/public-socket.io/',
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
    io.on('connection', (socket) => {
        logger.info('새로운 퍼블릭 연결 시도', {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
        
        const roomId = socket.handshake.query.roomId;
        // 이벤트 핸들러 등록
        registerRoomHandlers(socket);
        registerDrawingHandlers(socket, io);
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