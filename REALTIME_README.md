# Real-Time Collaborative Editing Features

This document describes the real-time communication features implemented for the list editing application.

## Overview

The real-time system enables multiple users to collaboratively edit lists in real-time with features like:
- Live updates across all connected users
- User presence indicators
- Typing indicators
- Conflict resolution
- Room-based isolation

## Architecture

### Server-Side (Socket.IO)
- **File**: `server.js`
- **Features**:
  - WebSocket connections via Socket.IO
  - Room-based user management
  - Real-time event broadcasting
  - Conflict resolution with operational transformation
  - User presence tracking

### Client-Side (Socket.IO Client)
- **File**: `socket-client.js`
- **Features**:
  - Connection management
  - Event handling
  - Typing indicators
  - Reconnection logic

### API Integration
- **File**: `api.js`
- **Features**:
  - Real-time function wrappers
  - Event handler management
  - Room ID generation
  - Conflict resolution helpers

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

## Usage

### Basic Setup

```javascript
import { enableRealTime, joinCollaborativeSession } from './api.js';

// Enable real-time features
enableRealTime();

// Join a collaborative session
const roomId = 'list_123_user_456';
const token = 'your-jwt-token';
joinCollaborativeSession(roomId, token);
```

### Collaborative List Editing

```javascript
import { CollaborativeListEditor } from './real-time-demo.js';

const editor = new CollaborativeListEditor();

// Initialize with user and list info
await editor.init('user123', 'list456', 'jwt-token');

// Add items with real-time sync
editor.addItem('Buy groceries');
editor.addItem('Call mom');

// Update items
editor.updateItem(0, 'Buy groceries (urgent)');

// Remove items
editor.removeItem(1);
```

### Event Handling

```javascript
import { setRealTimeHandlers } from './api.js';

setRealTimeHandlers({
    onUserJoined: (data) => {
        console.log(`${data.username} joined the session`);
    },
    
    onListUpdated: (data) => {
        console.log('List updated by:', data.username);
        // Update your UI here
    },
    
    onUserTyping: (data) => {
        if (data.isTyping) {
            console.log(`${data.username} is typing...`);
        }
    },
    
    onError: (data) => {
        console.error('Real-time error:', data.message);
    }
});
```

## Features

### 1. Room System
- Each list has a unique room ID
- Users join rooms to collaborate on specific lists
- Automatic room cleanup when users leave

```javascript
import { createRoomId } from './api.js';

const roomId = createRoomId('list123', 'user456');
// Result: 'list_list123_user_user456'
```

### 2. Real-Time Updates
- Changes are broadcast to all users in the same room
- Optimistic updates for immediate UI feedback
- Conflict resolution for simultaneous edits

```javascript
import { addItemRealTime, removeItemRealTime, updateItemRealTime } from './api.js';

// Add item
addItemRealTime(roomId, listId, 'New item');

// Remove item
removeItemRealTime(roomId, listId, 0);

// Update item
updateItemRealTime(roomId, listId, 0, 'Updated item');
```

### 3. User Presence
- Track who's currently editing
- Show online/offline status
- Handle disconnections gracefully

### 4. Typing Indicators
- Show when users are typing
- Auto-stop after inactivity
- Configurable timeout

```javascript
import { startTyping, stopTyping, setTypingTimeout } from './api.js';

// Start typing indicator
startTyping(roomId);

// Auto-stop after 2 seconds
setTypingTimeout(roomId, 2000);

// Manual stop
stopTyping(roomId);
```

### 5. Conflict Resolution
- Simple timestamp-based conflict resolution
- Extensible for more sophisticated OT algorithms
- Handles simultaneous edits gracefully

## API Reference

### Core Functions

#### `enableRealTime()`
Enables real-time features and establishes Socket.IO connection.

#### `disableRealTime()`
Disconnects from Socket.IO and disables real-time features.

#### `joinCollaborativeSession(roomId, token)`
Joins a collaborative editing session for a specific room.

#### `leaveCollaborativeSession()`
Leaves the current collaborative session.

### List Operations

#### `addItemRealTime(roomId, listId, item)`
Adds an item to the list with real-time sync.

#### `removeItemRealTime(roomId, listId, itemIndex)`
Removes an item from the list with real-time sync.

#### `updateItemRealTime(roomId, listId, itemIndex, newItem)`
Updates an item in the list with real-time sync.

### Typing Indicators

#### `startTyping(roomId)`
Starts typing indicator for the current user.

#### `stopTyping(roomId)`
Stops typing indicator for the current user.

#### `setTypingTimeout(roomId, delay)`
Sets auto-stop timeout for typing indicator.

### Event Handling

#### `setRealTimeHandlers(handlers)`
Sets event handlers for real-time events.

Available handlers:
- `onUserJoined`: When a user joins the room
- `onUserLeft`: When a user leaves the room
- `onListUpdated`: When the list is updated by another user
- `onUserTyping`: When typing indicators change
- `onError`: When errors occur
- `onRoomJoined`: When successfully joining a room

### Utility Functions

#### `getRealTimeStatus()`
Returns current connection status.

#### `createRoomId(listId, userId)`
Creates a unique room ID for a list.

#### `resolveConflict(localChanges, remoteChanges)`
Resolves conflicts between local and remote changes.

## Error Handling

The system includes comprehensive error handling:

```javascript
setRealTimeHandlers({
    onError: (data) => {
        console.error('Real-time error:', data.message);
        // Handle errors appropriately
        if (data.message.includes('Authentication failed')) {
            // Re-authenticate user
        }
    }
});
```

## Security Considerations

1. **Authentication**: JWT tokens are required for room access
2. **Authorization**: Users can only access rooms they're authorized for
3. **Input Validation**: All inputs are validated before processing
4. **Rate Limiting**: Consider implementing rate limiting for production

## Production Considerations

1. **Redis**: For scaling across multiple server instances
2. **Load Balancing**: Socket.IO supports sticky sessions
3. **Monitoring**: Implement logging and monitoring
4. **Backup**: Regular database backups for collaborative data

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check server is running
   - Verify CORS settings
   - Check network connectivity

2. **Updates Not Syncing**
   - Verify room ID is correct
   - Check authentication token
   - Ensure event handlers are set

3. **High Latency**
   - Check network conditions
   - Consider server location
   - Monitor server performance

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'socket.io-client:*');
```

## Examples

See `real-time-demo.js` for comprehensive usage examples and the `CollaborativeListEditor` class for a complete implementation. 