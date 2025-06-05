const { logger, AppError } = require('../../common/error/errorHandler');

function registerRoomHandlers(socket) {
    // 방 참가 이벤트
    socket.on('joinRoom', ({roomId}) => {
        try {
            socket.join(roomId);
            
            // 방에 있는 모든 소켓 정보 가져오기
            const roomSockets = Array.from(socket.server.sockets.adapter.rooms.get(roomId) || []);
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
}

module.exports = {
    registerRoomHandlers
}; 