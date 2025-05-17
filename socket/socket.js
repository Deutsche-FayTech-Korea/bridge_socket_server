const { Server } = require('socket.io');
const { logger } = require('../common/error/errorHandler');
const jwt = require('jsonwebtoken');

let io; // io 인스턴스를 전역 변수로 선언

function socketConnect(server) {
    // Socket.IO 초기화
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        path: '/socket.io/',                //ㅇ걸로 안하면 오류남.. 나중에 수정정
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // 연결 이벤트 처리
    io.on('connection', (socket) => {
        logger.info('새로운 연결 시도', {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });

        // 토큰 검증 -> auth 서버랑 연동 아직 안되서 안함

        // 방 참가 이벤트
        socket.on('joinRoom', ({roomId}) => {
            try {

                socket.join(roomId);
                
                // 방에 있는 모든 소켓 정보 가져오기
                const roomSockets = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
                const roomParticipants = roomSockets.map(socketId => ({
                    socketId,
                    isNewJoiner: socketId === socket.id
                }));

                logger.info('방 참가', { 
                    roomId,
                    socketId: socket.id,
                    userId: socket.userId,
                    timestamp: new Date().toISOString(),
                    roomParticipants: roomParticipants
                });
            
                // 방에 있는 다른 사용자들에게 새 참가자 알림
                socket.to(roomId).emit('userJoined', {
                    userId: socket.userId,
                    socketId: socket.id,
                    timestamp: new Date()
                });
            } catch (error) {
                logger.error('방 참가 실패', { 
                    roomId,
                    socketId: socket.id,
                    userId: socket.userId,
                    error: error.message
                });
            }
        });

        //그리기 이벤트 - 클라이언트 -> 서버 받았을 때
        socket.on('drawLine', ({roomId, data}) => {
            try {
                if (!roomId || !data) {
                    logger.error('잘못된 그리기 데이터', {
                        roomId,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
                
                io.to(roomId).emit('drawLine', {
                    data,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });

                // 로깅은 서버에서만
                logger.info('그리기 이벤트 전송', {
                    roomId,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                logger.error('그리기 이벤트 처리 실패', {
                    roomId,
                    socketId: socket.id,
                    error: error.message
                });
            }
        });


        // 방 나가기 이벤트
        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
            logger.info('방 나가기', { 
                roomId,
                socketId: socket.id,
                userId: socket.userId,
                timestamp: new Date().toISOString()
            });

            // 방에 있는 다른 사용자들에게 퇴장 알림
            socket.to(roomId).emit('userLeft', {
                userId: socket.userId,
                socketId: socket.id,
                timestamp: new Date()
            });
        });

        // 연결 해제 이벤트
        socket.on('disconnect', () => {
            logger.info('연결 해제', { 
                socketId: socket.id,
                userId: socket.userId,
                timestamp: new Date().toISOString()
            });
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    return io;
}

function connectToRoom(roomId) {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    return io.in(roomId);
}

function disconnectFromRoom(roomId, socketId) {
    if (!io) {
        throw new Error('Socket.IO가 초기화되지 않았습니다.');
    }
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
        socket.leave(roomId);
    }
}

module.exports = {
    socketConnect,
    getIO,
    connectToRoom,
    disconnectFromRoom
};


