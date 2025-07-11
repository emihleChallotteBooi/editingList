import {
  viewList,
  updateList,
  createRoomId,
  joinCollaborativeSession,
  leaveCollaborativeSession,
  updateItemRealTime,
  setRealTimeHandlers,
  startTyping,
  stopTyping,
  setTypingTimeout
} from './api.js';

// DOM Elements
const editor = document.getElementById('editor');
const saveBtn = document.getElementById('saveBtn');
const typingStatus = document.getElementById('typingStatus');
const fileInput = document.getElementById('fileInput');

// User + List context
const listId = '1';       // Make dynamic later
const userId = 'user123'; // Replace with session value
const roomId = createRoomId(listId, userId);

// Load initial content + join real-time session
(async function initEditor() {
  try {
    joinCollaborativeSession(roomId, 'dummy-token');
    
    const data = await viewList(listId, userId);
    editor.value = data.list.content;

    setRealTimeHandlers({
      onListUpdated: (update) => {
        if (update.operation === 'update_item') {
          editor.value = update.item;
        }
      },
      onUserTyping: () => {
        typingStatus.textContent = 'Someone is typing...';
        setTimeout(() => (typingStatus.textContent = ''), 2000);
      }
    });
  } catch (err) {
    alert('Error initializing editor: ' + err.message);
  }
})();

// Save button click
saveBtn.addEventListener('click', async () => {
  const content = editor.value;
  try {
    await updateList(listId, userId, { content });
    alert('List saved!');
  } catch (err) {
    alert('Save failed: ' + err.message);
  }
});

// Editor live typing
editor.addEventListener('input', () => {
  const content = editor.value;

  updateItemRealTime(roomId, listId, 0, content);
  startTyping(roomId);
  setTypingTimeout(roomId, 2000);
});

// File upload
fileInput?.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    editor.value = e.target.result;
    updateItemRealTime(roomId, listId, 0, editor.value);
  };

  reader.onerror = function (e) {
    alert('Error reading file: ' + e.target.error.name);
  };

  reader.readAsText(file);
});
