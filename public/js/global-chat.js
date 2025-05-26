class GlobalChat {
  constructor() {
    // Elements
    this.chatContainer = document.querySelector('.global-chat');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendChat');
    this.userCount = document.getElementById('userCount');
    this.usernameModal = document.getElementById('usernameModal');
    this.usernameInput = document.getElementById('usernameInput');
    this.usernameSubmit = document.getElementById('usernameSubmit');
    
    // State
    this.socket = null;
    this.username = localStorage.getItem('chatUsername') || null;
    
    // Initialize
    this.initSocket();
    this.setupEventListeners();
    
    // Show username modal if not set
    if (!this.username) {
      this.showUsernameModal();
    } else {
      this.connectToChat(this.username);
    }
  }
  
  initSocket() {
    this.socket = io('http://localhost:3001', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Socket event handlers
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      if (this.username) {
        this.socket.emit('setUsername', this.username);
      }
    });
    
    this.socket.on('init', (data) => {
      data.messages.forEach(msg => this.addMessage(msg));
      this.updateUserCount(data.userCount);
    });
    
    this.socket.on('newMessage', (msg) => {
      this.addMessage(msg);
    });
    
    this.socket.on('systemMessage', (msg) => {
      this.addSystemMessage(msg);
    });
    
    this.socket.on('userCount', (count) => {
      this.updateUserCount(count);
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      this.addSystemMessage('Connection lost. Reconnecting...');
    });
  }
  
  setupEventListeners() {
    // Send message
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    
    // Username modal
    this.usernameSubmit.addEventListener('click', () => this.handleUsernameSubmit());
    this.usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUsernameSubmit();
    });
  }
  
  showUsernameModal() {
    this.usernameModal.style.display = 'flex';
    this.usernameInput.focus();
  }
  
  hideUsernameModal() {
    this.usernameModal.style.display = 'none';
  }
  
  handleUsernameSubmit() {
    const username = this.usernameInput.value.trim();
    if (username) {
      this.username = username;
      localStorage.setItem('chatUsername', username);
      this.hideUsernameModal();
      this.connectToChat(username);
    }
  }
  
  connectToChat(username) {
    if (this.socket.connected) {
      this.socket.emit('setUsername', username);
    }
  }
  
  sendMessage() {
    const message = this.chatInput.value.trim();
    if (message && this.username) {
      this.socket.emit('sendMessage', message);
      this.chatInput.value = '';
    }
  }
  
  addMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date(msg.timestamp);
    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div>
        <span class="message-username">${msg.username}:</span>
        <span class="message-text">${msg.text}</span>
      </div>
      <div class="message-time">${timeString}</div>
    `;
    
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.style.fontStyle = 'italic';
    messageDiv.style.opacity = '0.8';
    messageDiv.textContent = text;
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  updateUserCount(count) {
    this.userCount.textContent = `${count} online`;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add player-page class to chat container on player page
  if (document.querySelector('.player-container')) {
    document.querySelector('.global-chat').classList.add('player-page');
  }
  
  new GlobalChat();
});