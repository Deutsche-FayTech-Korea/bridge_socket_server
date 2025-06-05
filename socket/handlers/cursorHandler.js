const { logger, AppError } = require('../../common/error/errorHandler');

function registerCursorHandlers(socket) {
    //커서 위치 받았을 때 이벤트
    socket.on('sendCursorPosition', ({roomId, data}) => {
        try {
            if (!roomId || !data) {
                logger.error('잘못된 커서 위치 데이터', {
                    roomId,
                    socketId: socket.id,
                    data,
                    timestamp: new Date().toISOString()
                });
                throw new AppError('잘못된 커서 위치 데이터입니다', 400);
            }
            
            socket.to(roomId).emit('sendCursorPosition', {
                data,
                socketId: socket.id,
                userId: socket.userId,
                timestamp: new Date().toISOString()
            });

            logger.info('커서 위치 받았을 때 이벤트', {
                roomId,
                data,
                socketId: socket.id,
                userId: socket.userId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('커서 위치 보내기 이벤트 처리 실패', {
                roomId,
                socketId: socket.id,
                error: error.message
            });
        }
    });
}

module.exports = {
    registerCursorHandlers
}; 