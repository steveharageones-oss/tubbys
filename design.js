// design.js
// Frontend for Design Your Own tumbler feature

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const previewArea = document.getElementById('preview-area');
const previewActions = document.getElementById('preview-actions');
const generateBtn = document.getElementById('generate-btn');
const actionButtons = document.getElementById('action-buttons');
const redoBtn = document.getElementById('redo-btn');
const buyBtn = document.getElementById('buy-btn');
const loadingSpinner = document.getElementById('loading-spinner');

let conversation = [
  { role: 'assistant', content: 'Hey there! I\'m excited to help you design a unique 20oz tumbler. What theme or idea did you have in mind? 🎨' }
];

let currentImageUrl = null;
let currentPrompt = null;

// Send message to AI designer
async function sendMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Add user message to UI
  addMessage(userMessage, 'user');
  conversation.push({ role: 'user', content: userMessage });
  chatInput.value = '';

  // Show typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message typing';
  typingDiv.innerHTML = '<p>Thinking...</p>';
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversation }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const data = await response.json();
    const botMessage = data.choices[0].message.content;

    // Remove typing indicator
    typingDiv.remove();

    // Add bot message
    addMessage(botMessage, 'bot');
    conversation.push({ role: 'assistant', content: botMessage });

    // Show generate button after a few messages
    if (conversation.length >= 3) {
      previewActions.style.display = 'block';
    }
  } catch (error) {
    typingDiv.remove();
    addMessage('Oops! Something went wrong. Please try again. 🙁', 'bot');
    console.error('Chat error:', error);
  }
}

// Add message to chat UI
function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `message ${sender}-message`;
  div.innerHTML = `<p>${escapeHtml(text)}</p>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Generate design image
async function generateDesign() {
  // Build prompt from conversation
  const userMessages = conversation
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('. ');

  const prompt = userMessages || 'beautiful custom tumbler design';
  currentPrompt = prompt;

  // Show loading
  generateBtn.style.display = 'none';
  loadingSpinner.style.display = 'block';

  try {
    const response = await fetch('/api/generate-design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    currentImageUrl = data.imageUrl;

    // Show image in preview area
    previewArea.innerHTML = `
      <img src="${currentImageUrl}" alt="Your custom tumbler design" class="design-preview-img">
      <p class="design-note">This is a mockup preview. The final print will be sized for a 20oz tumbler.</p>
    `;

    // Show action buttons
    loadingSpinner.style.display = 'none';
    actionButtons.style.display = 'flex';
  } catch (error) {
    loadingSpinner.style.display = 'none';
    generateBtn.style.display = 'block';
    previewArea.innerHTML = `
      <div class="preview-placeholder">
        <span class="placeholder-icon">😅</span>
        <p>Something went wrong generating your design. Please try again!</p>
      </div>
    `;
    console.error('Generate error:', error);
  }
}

// Redo design
function redoDesign() {
  actionButtons.style.display = 'none';
  generateBtn.style.display = 'block';
  previewArea.innerHTML = `
    <div class="preview-placeholder">
      <span class="placeholder-icon">🖼️</span>
      <p>Your new design will appear here.</p>
    </div>
  `;
  currentImageUrl = null;
}

// Buy design via Stripe
async function buyDesign() {
  if (!currentImageUrl) return;

  buyBtn.disabled = true;
  buyBtn.textContent = 'Loading Checkout...';

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: '25.00',
        image: currentImageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout');
    }

    const data = await response.json();
    window.location.href = data.url;
  } catch (error) {
    buyBtn.disabled = false;
    buyBtn.textContent = 'Buy This Design — $25';
    alert('Something went wrong. Please try again.');
    console.error('Checkout error:', error);
  }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
generateBtn.addEventListener('click', generateDesign);
redoBtn.addEventListener('click', redoDesign);
buyBtn.addEventListener('click', buyDesign);
