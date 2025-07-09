# EditingList - Real-Time Collaborative List Editor

A real-time collaborative list editing application built with Node.js, Socket.IO, and Firebase.

## Features

### Core Features
- ✅ Create, read, update, and delete lists
- ✅ Firebase integration for data persistence
- ✅ User authentication system

### Real-Time Collaborative Features
- ✅ **Live Updates**: See changes from other users in real-time
- ✅ **User Presence**: Know who's currently editing
- ✅ **Typing Indicators**: See when others are typing
- ✅ **Room System**: Isolated editing sessions for different lists
- ✅ **Conflict Resolution**: Handle simultaneous edits gracefully
- ✅ **Connection Management**: Automatic reconnection and error handling

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Firebase project with Firestore database
- Firebase service account key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd editingList
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Place your `serviceAccountKey.json` in the project root
   - Update Firebase configuration in `firebase.js` if needed

4. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000` with Socket.IO support.

## Usage

### Basic List Operations

```javascript
import { addList, viewList, updateList, deleteList } from './api.js';

// Add a new list
await addList('user123', ['item1', 'item2', 'item3']);

// View a list
const list = await viewList('list456', 'user123');

// Update a list
await updateList('list456', 'user123', ['updated item1', 'item2']);

// Delete a list
await deleteList('list456');
```

### Real-Time Collaborative Editing

```javascript
import { 
    enableRealTime, 
    joinCollaborativeSession,
    addItemRealTime,
    setRealTimeHandlers 
} from './api.js';

// Enable real-time features
enableRealTime();

// Set up event handlers
setRealTimeHandlers({
    onUserJoined: (data) => console.log(`${data.username} joined`),
    onListUpdated: (data) => console.log('List updated by:', data.username),
    onUserTyping: (data) => console.log(`${data.username} is typing`)
});

// Join a collaborative session
const roomId = 'list_123_user_456';
joinCollaborativeSession(roomId, 'jwt-token');

// Add items with real-time sync
addItemRealTime(roomId, 'list123', 'New collaborative item');
```

### Complete Example

See `real-time-demo.js` for a complete implementation example using the `CollaborativeListEditor` class.

## Project Structure

```
editingList/
├── server.js              # Main server with Socket.IO integration
├── api.js                 # API functions with real-time wrappers
├── socket-client.js       # Socket.IO client implementation
├── real-time-demo.js      # Complete usage example
├── test-realtime.js       # Real-time features test
├── firebase.js            # Firebase configuration
├── package.json           # Dependencies and scripts
├── REALTIME_README.md     # Detailed real-time documentation
└── README.md              # This file
```

## Real-Time Features

### Room System
Each list has a unique room where users can collaborate:
- Automatic room creation and cleanup
- User authentication for room access
- Isolated editing sessions

### Live Updates
- Changes broadcast to all users in the same room
- Optimistic updates for immediate feedback
- Conflict resolution for simultaneous edits

### User Presence
- Track who's currently editing
- Show online/offline status
- Handle disconnections gracefully

### Typing Indicators
- Show when users are typing
- Auto-stop after inactivity
- Configurable timeout

## API Reference

### Core Functions
- `enableRealTime()` - Enable real-time features
- `disableRealTime()` - Disable real-time features
- `joinCollaborativeSession(roomId, token)` - Join collaborative session
- `leaveCollaborativeSession()` - Leave current session

### List Operations
- `addItemRealTime(roomId, listId, item)` - Add item with real-time sync
- `removeItemRealTime(roomId, listId, index)` - Remove item with real-time sync
- `updateItemRealTime(roomId, listId, index, item)` - Update item with real-time sync

### Event Handling
- `setRealTimeHandlers(handlers)` - Set up event handlers
- `getRealTimeStatus()` - Get connection status
- `createRoomId(listId, userId)` - Create unique room ID

## Testing

Run the real-time features test:

```bash
node test-realtime.js
```

This will test:
- Socket.IO connection
- Room joining
- Event handling
- User management

## Development

### Adding New Features
1. Update `server.js` for server-side Socket.IO events
2. Update `socket-client.js` for client-side handling
3. Update `api.js` for new function wrappers
4. Add tests in `test-realtime.js`

### Debugging
Enable Socket.IO debug logging:
```javascript
localStorage.setItem('debug', 'socket.io-client:*');
```

## Production Considerations

1. **Security**: Implement proper JWT verification
2. **Scaling**: Use Redis for multiple server instances
3. **Monitoring**: Add logging and performance monitoring
4. **Backup**: Regular database backups for collaborative data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

ISC License

## Support

For detailed real-time features documentation, see `REALTIME_README.md`.