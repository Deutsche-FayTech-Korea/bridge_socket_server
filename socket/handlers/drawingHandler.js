const { logger, AppError } = require('../../common/error/errorHandler');

function registerDrawingHandlers(socket) {

    socket.on('updateImage', ({ roomId, data }) => {
        try {
            if (!roomId || !data) {
                logger.error('잘못된 이미지 데이터', {
                    roomId,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });
                throw new AppError('잘못된 이미지 데이터입니다', 400);
            }

            socket.to(roomId).emit('updateImage', {
                roomId,
                data,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });

            logger.info('이미지 이벤트 전송', {
                roomId,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('이미지 이벤트 처리 실패', {
                roomId,
                socketId: socket.id,
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
                throw new AppError('잘못된 그리기 데이터입니다', 400);
            }
            
            socket.to(roomId).emit('drawLine', {
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
}

module.exports = {
    registerDrawingHandlers
}; 