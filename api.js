import realTimeClient from './socket-client.js';

const url = 'http://localhost:3000';

// Initialize real-time connection
let isRealTimeEnabled = false;

export function enableRealTime() {
    if (!isRealTimeEnabled) {
        realTimeClient.connect();
        isRealTimeEnabled = true;
    }
}

export function disableRealTime() {
    if (isRealTimeEnabled) {
        realTimeClient.disconnect();
        isRealTimeEnabled = false;
    }
}

export async function addList(userId, newList){
    const response = await fetch(`${url}/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, list: newList})
    });
    if (!response.ok) throw new Error ('Failed to create new list.');
    return await response.json();
}

export async function viewList(listId, userId){
    const response = await fetch(`${url}/view/${listId}`,{
        method: 'GET',
        body: JSON.stringify({listId})});
    if (!response.ok) throw new Error ('List not found.');
    return await response.json();
}

export async function updateList(listId, userId, newList){
    const response = await fetch(`${url}/update/${listId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({listId, list: newList})
    });
    if(!response.ok) throw new Error ('Failed to update list.');
    return await response.json();
}

export async function deleteList(listId){
    const response = await fetch(`${url}/delete/${listId}`, {
        method: 'DELETE',
        body: JSON.stringify({listId})
    });
    if(!response.ok) throw new Error ('Failed to delete list.');
    return {message: 'List deleted successfully.'};
}

export async function singIn(){
    const response = await fetch(`${url}/signIn`);
    if(!response.ok) throw new Error ('Failed to sign-in.');
    return {message: 'Sign-in successful.'}
}

// Real-time collaborative editing functions

// Join a collaborative editing session
export function joinCollaborativeSession(roomId, token) {
    enableRealTime();
    realTimeClient.joinRoom(roomId, token);
}

// Leave collaborative editing session
export function leaveCollaborativeSession() {
    realTimeClient.leaveRoom();
}

// Update list with real-time sync
export function updateListRealTime(roomId, listId, updates, operation = 'update') {
    if (!isRealTimeEnabled) {
        throw new Error('Real-time features not enabled. Call enableRealTime() first.');
    }
    
    realTimeClient.updateList(roomId, listId, updates, operation);
}

// Add item to list with real-time sync
export function addItemRealTime(roomId, listId, item) {
    const updates = {
        operation: 'add_item',
        item: item,
        timestamp: Date.now()
    };
    
    updateListRealTime(roomId, listId, updates, 'add_item');
}

// Remove item from list with real-time sync
export function removeItemRealTime(roomId, listId, itemIndex) {
    const updates = {
        operation: 'remove_item',
        itemIndex: itemIndex,
        timestamp: Date.now()
    };
    
    updateListRealTime(roomId, listId, updates, 'remove_item');
}

// Update item in list with real-time sync
export function updateItemRealTime(roomId, listId, itemIndex, newItem) {
    const updates = {
        operation: 'update_item',
        itemIndex: itemIndex,
        item: newItem,
        timestamp: Date.now()
    };
    
    updateListRealTime(roomId, listId, updates, 'update_item');
}

// Start typing indicator
export function startTyping(roomId) {
    if (isRealTimeEnabled) {
        realTimeClient.startTyping(roomId);
    }
}

// Stop typing indicator
export function stopTyping(roomId) {
    if (isRealTimeEnabled) {
        realTimeClient.stopTyping(roomId);
    }
}

// Set typing timeout (auto-stop after delay)
export function setTypingTimeout(roomId, delay = 2000) {
    if (isRealTimeEnabled) {
        realTimeClient.setTypingTimeout(roomId, delay);
    }
}

// Get real-time connection status
export function getRealTimeStatus() {
    return realTimeClient.getConnectionStatus();
}

// Set event handlers for real-time events
export function setRealTimeHandlers(handlers) {
    if (handlers.onUserJoined) {
        realTimeClient.onUserJoined = handlers.onUserJoined;
    }
    if (handlers.onUserLeft) {
        realTimeClient.onUserLeft = handlers.onUserLeft;
    }
    if (handlers.onListUpdated) {
        realTimeClient.onListUpdated = handlers.onListUpdated;
    }
    if (handlers.onUserTyping) {
        realTimeClient.onUserTyping = handlers.onUserTyping;
    }
    if (handlers.onError) {
        realTimeClient.onError = handlers.onError;
    }
    if (handlers.onRoomJoined) {
        realTimeClient.onRoomJoined = handlers.onRoomJoined;
    }
}

// Create a unique room ID for a list
export function createRoomId(listId, userId) {
    return `list_${listId}_user_${userId}`;
}

// Conflict resolution helper
export function resolveConflict(localChanges, remoteChanges) {
    // Simple conflict resolution strategy
    // In a production system, you'd want more sophisticated OT algorithms
    
    if (remoteChanges.timestamp > localChanges.timestamp) {
        return remoteChanges;
    }
    return localChanges;
}