const { logger, AppError } = require('../../common/error/errorHandler');

function registerCursorHandlers(socket) {
    //커서 위치 받았을 때 이벤트
    socket.on('sendCursorPosition', ({roomId, data}) => {
        try {
            // 빠른 유효성 검사
            if (!roomId || !data) return;
            
            // 최소한의 데이터만 전송
            socket.to(roomId).emit('sendCursorPosition', {
                data,
                socketId: socket.id,
                userId: socket.userId
            });

            // 로깅은 에러 발생 시에만
            if (process.env.NODE_ENV === 'development') {
                logger.debug('커서 위치 업데이트', {
                    roomId,
                    socketId: socket.id
                });
            }
            
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