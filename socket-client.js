import { io } from 'socket.io-client';

class RealTimeClient {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.currentUser = null;
        this.isConnected = false;
        this.typingTimeout = null;
        
        // Event handlers
        this.onUserJoined = null;
        this.onUserLeft = null;
        this.onListUpdated = null;
        this.onUserTyping = null;
        this.onError = null;
        this.onRoomJoined = null;
    }

    // Connect to Socket.IO server
    connect(serverUrl = 'http://localhost:3000') {
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.setupEventListeners();
    }

    // Setup Socket.IO event listeners
    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
        });

        this.socket.on('room-joined', (data) => {
            console.log('Joined room:', data);
            this.currentRoom = data.roomId;
            if (this.onRoomJoined) {
                this.onRoomJoined(data);
            }
        });

        this.socket.on('user-joined', (data) => {
            console.log('User joined:', data);
            if (this.onUserJoined) {
                this.onUserJoined(data);
            }
        });

        this.socket.on('user-left', (data) => {
            console.log('User left:', data);
            if (this.onUserLeft) {
                this.onUserLeft(data);
            }
        });

        this.socket.on('list-updated', (data) => {
            console.log('List updated:', data);
            if (this.onListUpdated) {
                this.onListUpdated(data);
            }
        });

        this.socket.on('update-confirmed', (data) => {
            console.log('Update confirmed:', data);
        });

        this.socket.on('user-typing', (data) => {
            if (this.onUserTyping) {
                this.onUserTyping(data);
            }
        });

        this.socket.on('error', (data) => {
            console.error('Socket error:', data);
            if (this.onError) {
                this.onError(data);
            }
        });
    }

    // Join a room (document/list)
    joinRoom(roomId, token) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        this.socket.emit('join-room', {
            roomId,
            token
        });
    }

    // Leave current room
    leaveRoom() {
        if (this.currentRoom) {
            this.socket.emit('leave-room', { roomId: this.currentRoom });
            this.currentRoom = null;
        }
    }

    // Send list update to all users in room
    updateList(roomId, listId, updates, operation = 'update') {
        if (!this.isConnected || !this.currentRoom) {
            throw new Error('Not connected or not in a room');
        }

        this.socket.emit('list-update', {
            roomId,
            listId,
            updates,
            operation
        });
    }

    // Start typing indicator
    startTyping(roomId) {
        if (!this.isConnected) return;

        this.socket.emit('typing-start', { roomId });
        
        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
    }

    // Stop typing indicator
    stopTyping(roomId) {
        if (!this.isConnected) return;

        this.socket.emit('typing-stop', { roomId });
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    // Auto-stop typing after delay
    setTypingTimeout(roomId, delay = 2000) {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        this.typingTimeout = setTimeout(() => {
            this.stopTyping(roomId);
        }, delay);
    }

    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.currentRoom = null;
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            currentRoom: this.currentRoom,
            socketId: this.socket ? this.socket.id : null
        };
    }
}

// Export singleton instance
const realTimeClient = new RealTimeClient();
export default realTimeClient; 