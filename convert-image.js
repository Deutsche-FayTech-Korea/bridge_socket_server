const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, 'TimeTOGO-aws.drawio (2).jpg');
const imageBuffer = fs.readFileSync(imagePath);
const base64Image = imageBuffer.toString('base64');

console.log('Base64 이미지 크기:', base64Image.length, 'bytes');
fs.writeFileSync('image-base64.txt', base64Image); 