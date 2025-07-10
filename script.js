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

const editor = document.getElementById('editor');
const saveBtn = document.getElementById('saveBtn');
const typingStatus = document.getElementById('typingStatus');

const listId = '1';          // hardcoded for now
const userId = 'user123';    // could be dynamically set from session/auth
const roomId = createRoomId(listId, userId);

let isTyping = false;

// Join room and load data
(async () => {
  try {
    joinCollaborativeSession(roomId, 'dummy-token');
    
    const data = await viewList(listId, userId);
    editor.value = data.list.content;

    setRealTimeHandlers({
      onListUpdated: (remoteUpdate) => {
        if (remoteUpdate.operation === 'update_item') {
          editor.value = remoteUpdate.item;
        }
      },
      onUserTyping: () => {
        typingStatus.textContent = 'Someone is typing...';
        setTimeout(() => (typingStatus.textContent = ''), 2000);
      }
    });
  } catch (err) {
    alert('Failed to load list: ' + err.message);
  }
})();

// Save button
saveBtn.addEventListener('click', async () => {
  const newContent = editor.value;
  try {
    await updateList(listId, userId, { content: newContent });
    alert('List saved!');
  } catch (err) {
    alert('Save failed: ' + err.message);
  }
});

// Typing + real-time update
editor.addEventListener('input', () => {
  const content = editor.value;

  updateItemRealTime(roomId, listId, 0, content); // using itemIndex 0 to represent full content

  if (!isTyping) {
    isTyping = true;
    startTyping(roomId);
    setTimeout(() => {
      isTyping = false;
      stopTyping(roomId);
    }, 2000);
  }

  setTypingTimeout(roomId);
});
