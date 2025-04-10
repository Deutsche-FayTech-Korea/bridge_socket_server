# 1. Node.js 공식 이미지 사용
FROM node:18

# 2. 앱 디렉토리 생성
WORKDIR /app

# 3. package.json이 있다면 복사 후 설치
COPY package*.json ./
RUN npm install

# 4. 전체 코드 복사
COPY . .

# 5. 서버 실행 포트
EXPOSE 3000

# 6. 서버 실행 명령
CMD ["node", "server.js"]
