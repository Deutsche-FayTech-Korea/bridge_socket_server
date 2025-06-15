const Redis = require('redis');
const { logger } = require('../common/error/errorHandler');

let redisClient = null;
let redisSubscriber = null;

// Redis 클라이언트 초기화 함수
async function initializeRedis(io) {
    try {
        // 이미 연결된 클라이언트가 있다면 재사용
        if (redisClient && redisClient.isOpen) {
            logger.info('기존 Redis 클라이언트 재사용');
            return redisClient;
        }

        // Redis 클라이언트 생성
        redisClient = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        // Redis 구독자 생성
        redisSubscriber = redisClient.duplicate();

        // 에러 핸들링
        redisClient.on('error', (err) => {
            logger.error('Redis 클라이언트 에러', { error: err.message });
        });

        redisSubscriber.on('error', (err) => {
            logger.error('Redis 구독자 에러', { error: err.message });
        });

        // 연결
        await redisClient.connect();
        await redisSubscriber.connect();

        logger.info('✅ Redis 클라이언트 연결됨');
        logger.info('✅ Redis 구독자 연결됨');

        // 구독 설정
        await redisSubscriber.subscribe('drawing-events', (message) => {
            try {
                const data = JSON.parse(message);
                io.to(data.roomId).emit('drawing:public', data);
            } catch (error) {
                logger.error('Redis 메시지 처리 실패', { error: error.message });
            }
        });

        logger.info('✅ Redis 초기화 완료');
        return redisClient;
    } catch (error) {
        logger.error('Redis 초기화 실패', { error: error.message });
        throw error;
    }
}

function getRedisClient() {
    if (!redisClient) {
        throw new Error('Redis 클라이언트가 초기화되지 않았습니다.');
    }
    return redisClient;
}

function getRedisSubscriber() {
    if (!redisSubscriber) {
        throw new Error('Redis 구독자가 초기화되지 않았습니다.');
    }
    return redisSubscriber;
}

module.exports = {
    initializeRedis,
    getRedisClient,
    getRedisSubscriber
};
