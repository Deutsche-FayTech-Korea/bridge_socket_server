const express = require('express');
const router = express.Router();
const { AppError } = require('../common/error/errorHandler');
const roomService = require('../service/roomService');

const roomController = {
    createRoom: async (req, res, next) => {
        try {
            const { mode, roomName, madeBy, userName } = req.body;
            
            // roomId 생성
            const { roomId, timestamp } = roomService.generateRoomId(roomName);
            
            // 방 생성
            const result = await roomService.createRoom(mode, roomId, roomName, madeBy, userName);
            
            res.json({
                success: true,
                message: "방 생성 성공",
                ...result,
                timestamp: result.timestamp.toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    joinRoom: async (req, res, next) => {
        try {            
            const { roomId, mode} = req.query;
            if (!roomId || !mode) {
                throw new AppError('roomId, mode는 필수입니다.', 400);
            }

            const result = await roomService.joinRoom(roomId, mode, req);
            res.json({
                success: true,
                message: "방 참가 성공",
                mode: result.mode,
                roomId: result.roomId,
                timestamp: result.timestamp.toISOString()
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = roomController;
