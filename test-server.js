// Simplified test server for Socket.IO real-time features
import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Store active users and their rooms
const activeUsers = new Map(); // socketId -> { userId, username, roomId }
const roomUsers = new Map(); // roomId -> Set of socketIds
const typingUsers = new Map(); // roomId -> Set of typing socketIds

// Mock JWT verification
function verifyToken(token) {
    // For testing purposes, accept any token
    return { userId: 'test-user-id', username: 'Test User' };
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Join room with authentication
    socket.on('join-room', async (data) => {
        try {
            const { roomId, token } = data;
            
            // Verify user authentication
            const user = verifyToken(token);
            if (!user) {
                socket.emit('error', { message: 'Authentication failed' });
                return;
            }

            // Leave previous room if any
            if (activeUsers.has(socket.id)) {
                const previousRoom = activeUsers.get(socket.id).roomId;
                socket.leave(previousRoom);
                
                if (roomUsers.has(previousRoom)) {
                    roomUsers.get(previousRoom).delete(socket.id);
                    if (roomUsers.get(previousRoom).size === 0) {
                        roomUsers.delete(previousRoom);
                    }
                }
            }

            // Join new room
            socket.join(roomId);
            
            // Store user info
            activeUsers.set(socket.id, {
                userId: user.userId,
                username: user.username,
                roomId: roomId
            });

            // Add to room's user list
            if (!roomUsers.has(roomId)) {
                roomUsers.set(roomId, new Set());
            }
            roomUsers.get(roomId).add(socket.id);

            // Send current room state
            socket.emit('room-joined', {
                roomId,
                users: getRoomUsers(roomId),
                document: { items: [] }
            });

            // Notify others in room
            socket.to(roomId).emit('user-joined', {
                userId: user.userId,
                username: user.username,
                socketId: socket.id
            });

            console.log(`👤 User ${user.username} joined room ${roomId}`);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Handle real-time list updates
    socket.on('list-update', async (data) => {
        try {
            const { roomId, listId, updates, operation } = data;
            const user = activeUsers.get(socket.id);
            
            if (!user || user.roomId !== roomId) {
                socket.emit('error', { message: 'Not authorized for this room' });
                return;
            }

            // Broadcast to all users in room (except sender)
            socket.to(roomId).emit('list-updated', {
                listId,
                updates,
                operation,
                userId: user.userId,
                username: user.username
            });

            // Send confirmation to sender
            socket.emit('update-confirmed', {
                listId,
                updates
            });

            console.log(`📝 List updated by ${user.username} in room ${roomId}`);

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
        const { roomId } = data;
        const user = activeUsers.get(socket.id);
        
        if (user && user.roomId === roomId) {
            if (!typingUsers.has(roomId)) {
                typingUsers.set(roomId, new Set());
            }
            typingUsers.get(roomId).add(socket.id);
            
            socket.to(roomId).emit('user-typing', {
                username: user.username,
                isTyping: true
            });
            
            console.log(`⌨️  ${user.username} started typing in room ${roomId}`);
        }
    });

    socket.on('typing-stop', (data) => {
        const { roomId } = data;
        const user = activeUsers.get(socket.id);
        
        if (user && user.roomId === roomId && typingUsers.has(roomId)) {
            typingUsers.get(roomId).delete(socket.id);
            
            socket.to(roomId).emit('user-typing', {
                username: user.username,
                isTyping: false
            });
            
            console.log(`💤 ${user.username} stopped typing in room ${roomId}`);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);
        if (user) {
            const { roomId, username } = user;
            
            // Remove from room
            if (roomUsers.has(roomId)) {
                roomUsers.get(roomId).delete(socket.id);
                if (roomUsers.get(roomId).size === 0) {
                    roomUsers.delete(roomId);
                }
            }
            
            // Remove from typing users
            if (typingUsers.has(roomId)) {
                typingUsers.get(roomId).delete(socket.id);
            }
            
            // Notify others
            socket.to(roomId).emit('user-left', {
                username,
                socketId: socket.id
            });
            
            activeUsers.delete(socket.id);
            console.log(`👋 User ${username} disconnected from room ${roomId}`);
        }
    });
});

// Helper function to get users in a room
function getRoomUsers(roomId) {
    if (!roomUsers.has(roomId)) return [];
    
    const users = [];
    roomUsers.get(roomId).forEach(socketId => {
        const user = activeUsers.get(socketId);
        if (user) {
            users.push({
                userId: user.userId,
                username: user.username,
                socketId: socketId
            });
        }
    });
    return users;
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO server ready for real-time connections`);
    console.log(`🧪 This is a simplified test server for Socket.IO features`);
}); 