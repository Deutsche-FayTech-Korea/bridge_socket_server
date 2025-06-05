const { logger } = require('../../common/error/errorHandler');
const { getPublicIO } = require('../publicSocket');

function registerPublicDrawingHandlers(socket) {
    // 이미지 데이터 수신 및 브로드캐스팅
    socket.on('drawing:public', (data) => {
        try {
            const { roomId, imageData } = data;
            
            // 이미지 데이터 유효성 검사
            if (!roomId || !imageData) {
                logger.error('잘못된 이미지 데이터', {
                    socketId: socket.id,
                    roomId,
                    hasImageData: !!imageData
                });
                return;
            }

            // 이미지 데이터를 Base64로 인코딩하여 전송
            const base64Image = Buffer.from(imageData).toString('base64');
            
            // 같은 방의 다른 클라이언트들에게 브로드캐스팅
            socket.to(roomId).emit('drawing:public', {
                imageData: base64Image,
                timestamp: new Date().toISOString()
            });

            logger.info('퍼블릭 이미지 전송 성공', {
                socketId: socket.id,
                roomId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('퍼블릭 이미지 전송 실패', {
                socketId: socket.id,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // 이미지 저장 요청 처리
    socket.on('drawing:save:public', async (data) => {
        try {
            const { roomId, imageData } = data;
            
            if (!roomId || !imageData) {
                throw new Error('필수 데이터가 누락되었습니다.');
            }

            // 이미지 데이터를 Base64로 인코딩
            const base64Image = Buffer.from(imageData).toString('base64');
            
            // 이미지 저장 로직 (필요에 따라 구현)
            // 예: 클라우드 스토리지에 저장하거나 데이터베이스에 저장

            // 저장 성공 응답
            socket.emit('drawing:save:public:success', {
                message: '이미지가 성공적으로 저장되었습니다.',
                timestamp: new Date().toISOString()
            });

            logger.info('퍼블릭 이미지 저장 성공', {
                socketId: socket.id,
                roomId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('퍼블릭 이미지 저장 실패', {
                socketId: socket.id,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            socket.emit('drawing:save:public:error', {
                message: '이미지 저장에 실패했습니다.',
                error: error.message
            });
        }
    });
}

module.exports = {
    registerPublicDrawingHandlers
}; 