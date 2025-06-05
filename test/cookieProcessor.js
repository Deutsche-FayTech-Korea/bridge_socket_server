const tough = require('tough-cookie');  // Artillery 내부에서도 사용하는 쿠키 파서

let vuCounter = 31;

function handleLoginResponse(requestParams, response, context, ee, next) {
  if (response.statusCode === 200) {
    console.log('로그인 성공:', response.body);

    // Set-Cookie 헤더에서 access_token 추출
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const cookies = setCookieHeader.map(cookieStr => tough.Cookie.parse(cookieStr));
      const accessTokenCookie = cookies.find(cookie => cookie && cookie.key === 'access_token');

      if (accessTokenCookie) {
        context.vars.authToken = accessTokenCookie.value;
        console.log('Captured authToken from Set-Cookie header:', context.vars.authToken);
      } else {
        console.log('No access_token found in Set-Cookie header!');
      }
    } else {
      console.log('No Set-Cookie header in response!');
    }

  } else {
    console.log('로그인 실패:', response.statusCode, response.body);
  }
  return next();
}

function setVariables(context, events, done) {
  const timestamp = Date.now();
  context.vars.vu = vuCounter++;
  context.vars.timestamp = timestamp;
  console.log('생성된 변수:', { vu: context.vars.vu, timestamp: context.vars.timestamp });

  // (선택) 만약 $cookies에 access_token이 이미 있으면 추가로 로그 출력
  const cookies = context.vars.$cookies;
  if (cookies && cookies.access_token) {
    context.vars.authToken = cookies.access_token;
    console.log('Captured authToken from $cookies (setVariables):', context.vars.authToken);
  }

  return done();
}

module.exports = {
  handleLoginResponse,
  setVariables
};
