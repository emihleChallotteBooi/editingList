//Server implementation using pure node.js. Why? Because I'm a masochist of course!
import admin from 'firebase-admin';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import serviceAccount from './serviceAccountKey.json';
import http from 'http';
import {parse} from 'url'; // Helps extract different parts of a URL (like path and query string)
import { Server } from 'socket.io';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const server = http.createServer((req, res) => {

    const parsedUrl = parse(req.url, true); //return path, and also parses all queries
    const method = req.method;
    const path = parsedUrl.pathname;
    const query = parsedUrl.query; //returns an object of all queries made

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if(method === 'OPTIONS'){
        res.writeHead(204);
        res.end();
    }

    //function to get the request body of client's request

    function getRequestBody(req){
        return new Promise((resolve, reject)=> {
            let body = '';
            req.on('data', chunk => {
                body += chunk;
            });
            req.on('end', () => {
                try{
                    resolve(JSON.parse(body));
                }
                catch(err){
                    reject(new Error('Invalid JSON:' + err.message));
                }
            })
        })
    }

    // add, view, update, deleteList - need to be refactored to work with firebase
    async function addList(id, list){
        if(!id || !Array.isArray(list)){
            throw new Error('Invalid input. Must include userId and array.');
        }
        const userListsRef = db.collection('users').doc(id).collection('lists');
        const docRef = await userListsRef.add({list});
    }

    async function viewList(userId, listId){
        const userListRef = db.collection('users').doc(userId).collection('lists').doc(listId);
        const doc = await userListRef.get();
    }

    async function updateList(userId, listId, list){
        const userListRef = db.collection('users').doc(userId).collection('lists').doc(listId).update(list);
    }

    async function deleteList(userId, listId){
        await db.collection('users').doc(userId).collection('lists').doc(listId).delete();
    }

    //Here, a new list will be added by the user
    if(method === 'POST' && path === '/add'){
        getRequestBody(req)
        .then(data => {
            const { id, list } = data;
            return addList(id, list)
            .then(docRef => {
                res.writeHead(201, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(`List added successfully. (docId: ${docRef.id})`));
            })
        })
        .catch(err => {
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: err.message}));
        })
    }

    //Here, the user will view a particular list in its entirety
    if(method === 'GET'){
        try{
            getRequestBody(req)
            .then(data => {
                const {listId} = data;
                const userId = user.uid;
                viewList(userId, listId)
                res.writeHead(200, {'Content-Type':'application/json'});
                res.end(JSON.stringify(data));
            })
            .catch(err => {
                res.writeHead(404);
                res.end(JSON.stringify({error: err.message}))
            });
        }
        catch{
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Invalid view route.'}));
        }
    }

    //Here, the user will be able to update a list in its entirety or an element of it
    if(method === 'PUT'){
       getRequestBody(req)
        .then(data => {
            const {listId, list} = data;
            const userId = user.uid;
            updateList(userId, listId, list);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({message: 'List updated successfully.'}))
        })
        .catch(err => {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: err.message}));
        })
        

        //still need to implement element-wise updates
    }

    //Here, a user should be able to delete an entire list or an element of it
    if(method === 'DELETE'){
        try{
            getRequestBody(req)
            .then(data => {
                const {listId} = data;
                const userId = user.uid;
                deleteList(userId, listId)
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'List deleted successfully.'}));
                
            })
            .catch(err => {
                res.writeHead(404, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'Could not find list.'}));
            });
        }
        catch{
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Invalid view route.'}));
        }

        //still need to implement element-wise deletions
    }
});

// Socket.IO setup
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

// JWT verification helper (placeholder - integrate with your auth system)
function verifyToken(token) {
    // TODO: Implement JWT verification
    // For now, return a mock user
    return { userId: 'mock-user-id', username: 'Mock User' };
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

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
                
                // Remove from previous room's user list
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
            const roomState = await getRoomState(roomId);
            socket.emit('room-joined', {
                roomId,
                users: getRoomUsers(roomId),
                document: roomState
            });

            // Notify others in room
            socket.to(roomId).emit('user-joined', {
                userId: user.userId,
                username: user.username,
                socketId: socket.id
            });

            console.log(`User ${user.username} joined room ${roomId}`);
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

            // Apply operational transformation for conflict resolution
            const transformedUpdates = await applyOperationalTransformation(roomId, updates, operation);
            
            // Update database
            await updateListInDatabase(user.userId, listId, transformedUpdates);
            
            // Broadcast to all users in room (except sender)
            socket.to(roomId).emit('list-updated', {
                listId,
                updates: transformedUpdates,
                operation,
                userId: user.userId,
                username: user.username
            });

            // Send confirmation to sender
            socket.emit('update-confirmed', {
                listId,
                updates: transformedUpdates
            });

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
            console.log(`User ${username} disconnected from room ${roomId}`);
        }
    });
});

// Helper functions for real-time features

// Get current room state from database
async function getRoomState(roomId) {
    try {
        // This would typically fetch the current document/list state
        // For now, return empty state
        return { items: [] };
    } catch (error) {
        console.error('Error getting room state:', error);
        return { items: [] };
    }
}

// Get users in a specific room
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

// Simple operational transformation for conflict resolution
async function applyOperationalTransformation(roomId, updates, operation) {
    // This is a simplified OT implementation
    // In a production system, you'd want a more sophisticated approach
    
    // For now, we'll use a simple timestamp-based approach
    const timestamp = Date.now();
    
    return {
        ...updates,
        timestamp,
        operation,
        roomId
    };
}

// Update list in database with real-time sync
async function updateListInDatabase(userId, listId, updates) {
    try {
        const userListRef = db.collection('users').doc(userId).collection('lists').doc(listId);
        await userListRef.update({
            ...updates,
            lastModified: new Date(),
            lastModifiedBy: userId
        });
    } catch (error) {
        console.error('Error updating list in database:', error);
        throw error;
    }
}

if(path === '/signIn'){
    const signIn = async ((email, password) => {
        const auth = getAuth();

        try{
            const userCredential = signInWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            console.log("Sign-in successful:", user);
            return user;
        } catch (err){
            console.error('Failed to sign-in:', err,code, err.message);
        }
    })
}

const user = null; // this is a global user variable, so that I can access user.uid from anywhere.

server.listen(3000, () => {
    console.log('The server is up and running with Socket.IO support.')
})