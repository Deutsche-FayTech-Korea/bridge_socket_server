const winston = require('winston');

// 로그 포맷 정의
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// 로거 설정
const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        // 에러 로그는 별도 파일에 저장
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // 모든 로그는 combined.log에 저장
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
        }),
        // 콘솔 출력
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// 커스텀 에러 클래스
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

// 에러 핸들러 미들웨어
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // 상세한 에러 로깅
    logger.error('에러 발생', {
        timestamp: new Date().toISOString(),
        error: {
            message: err.message,
            stack: err.stack,
            code: err.statusCode,
            type: err.isOperational ? 'Operational' : 'Programming'
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            path: req.path,
            params: req.params,
            query: req.query,
            body: req.body,
            ip: req.ip
        },
        user: req.user ? {
            id: req.user.id,
            role: req.user.role
        } : 'anonymous'
    });

    // 운영 에러와 프로그래밍 에러 구분
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            timestamp: err.timestamp
        });
    } else {
        // 프로그래밍 에러: 클라이언트에게 상세 정보 숨김
        res.status(500).json({
            success: false,
            status: 'error',
            message: '서버 에러가 발생했습니다.',
            timestamp: new Date().toISOString()
        });
    }
};

// 로그 유틸리티 함수들
const logUtils = {
    // API 요청 로깅
    logRequest: (req, res, next) => {
        logger.info('API 요청', {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            body: req.body,
            ip: req.ip
        });
        next();
    },

    // API 응답 로깅
    logResponse: (req, res, next) => {
        const originalSend = res.send;
        res.send = function (body) {
            logger.info('API 응답', {
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                responseTime: Date.now() - req._startTime
            });
            originalSend.call(this, body);
        };
        next();
    }
};

module.exports = {
    AppError,
    errorHandler,
    logger,
    logUtils
};