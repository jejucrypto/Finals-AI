class SimpleChat {
  constructor() {
    this.socket = null;
    this.token = localStorage.getItem('chatToken');
    this.init();
  }

  init() {
    this.connectSocket();
    this.setupEventListeners();
  }

  connectSocket() {
    this.socket = io({
      reconnection: true,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('auth', (data) => {
      this.token = data.token;
      localStorage.setItem('chatToken', this.token);
      this.socket.emit('authenticate', this.token);
    });

    this.socket.on('history', (history) => {
      history.forEach(msg => this.displayMessage(msg));
    });

    this.socket.on('message', (msg) => {
      this.displayMessage(msg);
    });
  }

  setupEventListeners() {
    document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message && this.socket) {
      this.socket.emit('message', message);
      input.value = '';
    }
  }

  displayMessage(msg) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `<strong>${msg.user}:</strong> ${msg.text} <small>${msg.time}</small>`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.simpleChat = new SimpleChat();
});