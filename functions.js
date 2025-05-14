module.exports = {
  logRoomCreation: function(response, context, events, done) {
    console.log('방 생성 응답:', JSON.stringify(response, null, 2));
    if (response && response.created) {
      console.log(`✅ 방 생성 성공: ${response.roomId}`);
    } else {
      console.log(`❌ 방 생성 실패: ${JSON.stringify(response)}`);
    }
    return done();
  },

  logRoomJoin: function(response, context, events, done) {
    console.log(`[Room Join] ${response ? '성공' : '실패'}`);
    return done();
  },

  logImageSend: function(response, context, events, done) {
    console.log(`[Image Send] ${response ? '성공' : '실패'}`);
    return done();
  }
}; 