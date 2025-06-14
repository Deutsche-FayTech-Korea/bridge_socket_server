const crypto = require('crypto');
const { logger, AppError } = require('../error/errorHandler');

const generateHash = (name, timestamp) => {
    try {
        if (!name || !timestamp) {
            throw new AppError('name과 timestamp는 필수입니다.', 400);
        }

        logger.info('해시 생성 시작', { name, timestamp: timestamp.toISOString() });

        const data = `${name}-${timestamp.getTime()}`;
        const hash = crypto.createHash('sha256')
            .update(data)
            .digest('hex')
            .substring(0, 12);

        logger.info('해시 생성 완료', { 
            name, 
            timestamp: timestamp.toISOString(),
            hash 
        });

        return hash;
    } catch (error) {
        logger.error('해시 생성 실패', { 
            error: error.message,
            name,
            timestamp: timestamp?.toISOString()
        });
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('해시 생성 중 오류가 발생했습니다', 500);
    }
};

module.exports = {
    generateHash
}; 