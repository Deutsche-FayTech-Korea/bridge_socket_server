const express = require('express');
const router = express.Router();
const verifyToken = require('../../common/error/jwt');
const roomController = require('../../controller/roomController');

router.use(verifyToken);  // 인증 미들웨어 활성화

// 방 ID 생성
router.post('/generate-id', roomController.generateRoomId);

// 방 생성
router.post('/create', roomController.createRoom);

// 방 참가
router.get('/join', roomController.joinRoom);

module.exports = router; 