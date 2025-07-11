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

const listId = '1';          // Could be dynamic
const userId = 'user123';    // Should match auth/session later
const roomId = createRoomId(listId, userId);

// Load list + setup real-time
(async () => {
  try {
    // 1. Join the real-time editing room
    joinCollaborativeSession(roomId, 'dummy-token');

    // 2. Load list content
    const data = await viewList(listId, userId);
    editor.value = data.list.content;

    // 3. Setup real-time handlers
    setRealTimeHandlers({
      onListUpdated: (update) => {
        if (update.operation === 'update_item') {
          editor.value = update.item;
        }
      },
      onUserTyping: () => {
        typingStatus.textContent = 'Someone is typing...';
        setTimeout(() => {
          typingStatus.textContent = '';
        }, 2000);
      }
    });
  } catch (err) {
    alert('Error loading list or connecting: ' + err.message);
  }
})();

// Save manually
saveBtn.addEventListener('click', async () => {
  try {
    const content = editor.value;
    await updateList(listId, userId, { content });
    alert('List saved!');
  } catch (err) {
    alert('Save failed: ' + err.message);
  }
});

// Live editing
editor.addEventListener('input', () => {
  const content = editor.value;

  updateItemRealTime(roomId, listId, 0, content); // index 0 = entire doc

  startTyping(roomId);
  setTypingTimeout(roomId, 2000);
});
