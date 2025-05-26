document.addEventListener('DOMContentLoaded', () => {
  // Configuration
  const config = {
    openRouterApiKey: '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', // Replace with your key
    siteUrl: 'https://www.vinzgwapo.com', // Replace with your site URL
    siteName: 'Anime-Finals', // Replace with your site name
    defaultModel: 'openai/gpt-3.5-turbo' // Can change to other models
  };

  // Elements
  const aiButton = document.getElementById('aiButton');
  const aiChat = document.getElementById('aiChat');
  const closeChat = document.getElementById('closeChat');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendMessage');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // State
  let isDragging = false;
  let isChatOpen = false;
  let dragStartX = 0;
  let dragStartLeft = 0;
  let dragStartRight = 0;
  let chatHistory = [];

  // Initialize with welcome message
  addSystemMessage("Hello! I'm your Anime AI Assistant. Ask me anything about anime!");

  // Dragging functionality (same as before)
  aiButton.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', endDrag);

  // Toggle chat window
  aiButton.addEventListener('click', toggleChat);
  closeChat.addEventListener('click', toggleChat);

  // Message sending
  sendButton.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isChatOpen && !aiChat.contains(e.target) && !aiButton.contains(e.target)) {
      toggleChat();
    }
  });

  // Prevent window close when clicking inside
  aiChat.addEventListener('click', (e) => e.stopPropagation());

  /* ===== FUNCTIONS ===== */

  function startDrag(e) {
    if (e.button !== 0) return; // Only left mouse button
    isDragging = false;
    dragStartX = e.clientX;
    const buttonRect = aiButton.getBoundingClientRect();
    dragStartLeft = buttonRect.left;
    dragStartRight = window.innerWidth - buttonRect.right;
    aiButton.style.transition = 'none';
    document.body.style.userSelect = 'none'; // Prevent text selection during drag
  }

  function handleDrag(e) {
    if (!dragStartX) return;
    
    if (!isDragging && Math.abs(e.clientX - dragStartX) > 5) {
      isDragging = true;
    }
    
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const isStartingFromRight = aiButton.style.left === 'auto';
      
      if (isStartingFromRight) {
        const newRight = Math.max(0, dragStartRight - deltaX);
        aiButton.style.right = `${newRight}px`;
        aiButton.style.left = 'auto';
      } else {
        const newLeft = Math.max(0, dragStartLeft + deltaX);
        aiButton.style.left = `${newLeft}px`;
        aiButton.style.right = 'auto';
      }
      
      if (isChatOpen) positionChatRelativeToButton();
    }
  }

  function endDrag() {
    if (isDragging) {
      const buttonRect = aiButton.getBoundingClientRect();
      const isNearLeft = buttonRect.left < window.innerWidth / 2;
      
      aiButton.style.transition = 'left 0.3s ease, right 0.3s ease';
      
      if (isNearLeft) {
        aiButton.style.left = '20px';
        aiButton.style.right = 'auto';
      } else {
        aiButton.style.left = 'auto';
        aiButton.style.right = '20px';
      }
      
      setTimeout(() => {
        aiButton.style.transition = '';
      }, 300);
    }
    
    dragStartX = 0;
    document.body.style.userSelect = '';
  }

  function positionChatRelativeToButton() {
    const buttonRect = aiButton.getBoundingClientRect();
    aiChat.style.bottom = `${window.innerHeight - buttonRect.top + 20}px`;
    
    if (buttonRect.left + buttonRect.width/2 < window.innerWidth/2) {
      aiChat.style.left = `${buttonRect.left}px`;
      aiChat.style.right = 'auto';
    } else {
      aiChat.style.right = `${window.innerWidth - buttonRect.right}px`;
      aiChat.style.left = 'auto';
    }
  }

  function toggleChat() {
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
      aiChat.style.display = 'flex';
      setTimeout(() => {
        aiChat.classList.add('active');
        positionChatRelativeToButton();
        chatInput.focus();
      }, 10);
    } else {
      aiChat.classList.remove('active');
      setTimeout(() => {
        aiChat.style.display = 'none';
      }, 300);
    }
  }

  function addSystemMessage(content) {
    const message = {
      role: 'assistant',
      content: content
    };
    chatHistory.push(message);
    createMessageElement(message);
  }

  function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}-message`;
    
    // Create and append message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Simple markdown parsing (bold and italics)
    let formattedContent = message.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    
    contentDiv.innerHTML = formattedContent;
    messageDiv.appendChild(contentDiv);
    
    // Add timestamp
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.appendChild(timeDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
  }

  async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;
    
    // Add user message to chat
    const userMsgObj = {
      role: 'user',
      content: userMessage
    };
    chatHistory.push(userMsgObj);
    createMessageElement(userMsgObj);
    chatInput.value = '';
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai-message typing-indicator';
    typingIndicator.innerHTML = `
      <div class="message-content">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.siteUrl,
          'X-Title': config.siteName
        },
        body: JSON.stringify({
          model: config.defaultModel,
          messages: [
            {
              role: 'system',
              content: `You are an anime expert assistant. The user is on ${currentPage}. ` +
                       `Provide helpful, concise information about anime. ` +
                       `Use markdown for formatting (**bold**, *italics*). ` +
                       `Keep responses under 300 characters unless more detail is needed.`
            },
            ...chatHistory
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message;
      
      // Add AI response to chat
      chatHistory.push(aiMessage);
      createMessageElement(aiMessage);
      
    } catch (error) {
      console.error('AI Error:', error);
      const errorMsg = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`
      };
      createMessageElement(errorMsg);
    } finally {
      // Remove typing indicator
      chatMessages.removeChild(typingIndicator);
    }
  }
});