const { logger, AppError } = require('../../common/error/errorHandler');

function registerDrawingHandlers(socket, io) {

    socket.on('updateImage', ({ roomId, data, mode }) => {
        try {
            if (!roomId || !data) {
                logger.error('잘못된 이미지 데이터', {
                    roomId,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });
                throw new AppError('잘못된 이미지 데이터입니다', 400);
            }

            // 모든 클라이언트(본인 포함)에게 전송
            io.in(roomId).emit('updateImage', {
                roomId,
                data,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });

            logger.info('이미지 이벤트 전송', {
                roomId,
                mode, // 프론트에서 mode 전달 시 로그에 남김
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
    socket.on('drawLine', ({roomId, data, mode}) => {
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
                mode, // 프론트에서 mode 전달 시 로그에 남김
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