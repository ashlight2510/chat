// WebSocket 서버 설정
// Render 배포: https://chat-em45.onrender.com
const CONFIG = {
  WS_URL: 'wss://chat-em45.onrender.com/ws',
  LOCAL_WS_URL: 'ws://localhost:3000/ws'
};

const getWsUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return CONFIG.LOCAL_WS_URL;
  }
  return CONFIG.WS_URL;
};

if (typeof window !== 'undefined') {
  window.CHAT_CONFIG = CONFIG;
  window.getWsUrl = getWsUrl;
}
