const express = require('express');
const router = express.Router();
const { AppError, logger } = require('../common/error/errorHandler');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// MongoDB 연결 설정
const uri = process.env.MONGODB_URI;
let MongoDbClient = null;

// MongoDB 연결 함수
async function getMongoClient() {
    try{
    if (!MongoDbClient) {
        MongoDbClient = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        await MongoDbClient.connect();
        console.log('MongoDB 연결 성공');
        logger.info('MongoDB 연결 성공');
    }
    } catch (error) {
        logger.error('MongoDB 연결 실패:', error.message);
        throw new AppError('MongoDB 연결 실패', 500);
    }
    return MongoDbClient;
}

const generateRoomId = (userId, timestamp) => {
    const timeStr = timestamp.getTime().toString(36);
    const userStr = userId.substring(0, 4);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `${userStr}-${timeStr}-${randomStr}`;
};

const roomController = {
    createRoom: async (req, res, next) => {
        try {
            const { mode } = req.body;
            const userId = req.user.userId; // 인증된 사용자 ID
            const timestamp = new Date();
            
            // 유효성 검사
            if (!mode) {
                throw new AppError('mode는 필수입니다.', 400);
            }

            // 방 번호 생성 로직
            const roomId = generateRoomId(userId, timestamp);
            
            logger.info('방 생성 시도', { 
                roomId, 
                mode,
                userId,
                action: 'create',
                timestamp: timestamp.toISOString()
            });

            // MongoDB에 방 정보 저장
            const client = await getMongoClient();
            const database = client.db('test');
            const collection = database.collection('rooms');
            await collection.insertOne({
                roomId,
                mode,
                userId,
                createdAt: timestamp
            });

            res.json({
                success: true,
                message: "방 생성 성공",
                mode: mode,
                roomId: roomId,
                timestamp: timestamp.toISOString()
            });

            logger.info('방 생성 완료', { 
                roomId, 
                mode,
                userId,
                action: 'create',
                timestamp: timestamp.toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    joinRoom: async (req, res, next) => {
        try {
            const roomId = req.params.roomId;
            const mode = req.params.mode;

            // 유효성 검사
            if (!roomId || !mode) {
                throw new AppError('roomId와 mode는 필수입니다.', 400);
            }

            // 방 존재 여부 확인
            // TODO: 실제 데이터베이스 연동 시 여기서 확인
            socket.emit('joinRoom', {
                roomId: roomId,
                mode: mode
            });
            
            logger.info('방 참가 시도', { 
                roomId, 
                mode,
                action: 'join',
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                message: "방 참가 성공",
                mode: mode,
                roomId: roomId,
                timestamp: new Date().toISOString()
            });

            logger.info('방 참가 완료', { 
                roomId, 
                mode,
                action: 'join',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = roomController;
