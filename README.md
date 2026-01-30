# 랜덤 채팅

익명 1:1 랜덤 채팅. WebSocket 기반.

## 구조

- **backend/** — WebSocket 서버 (Render 배포)
- **frontend/** — 채팅 UI (GitHub Pages → chat.funnyfunny.cloud)

## 백엔드 배포 (Render)

1. Render에서 New Web Service 생성
2. Repo 연결 후 Root Directory: `chat/backend`
3. Build: `npm install`
4. Start: `npm start`
5. 배포 URL 예: `https://chat-jz6r.onrender.com`
6. WebSocket: `wss://chat-jz6r.onrender.com/ws`

## 프론트엔드

`frontend/config.js`에서 `WS_URL`을 Render 배포 URL에 맞게 설정.
