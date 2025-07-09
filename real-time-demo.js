import { 
    enableRealTime, 
    joinCollaborativeSession, 
    leaveCollaborativeSession,
    addItemRealTime,
    removeItemRealTime,
    updateItemRealTime,
    startTyping,
    stopTyping,
    setTypingTimeout,
    getRealTimeStatus,
    setRealTimeHandlers,
    createRoomId
} from './api.js';

// Demo: Collaborative List Editor
class CollaborativeListEditor {
    constructor() {
        this.currentList = [];
        this.currentRoomId = null;
        this.currentUserId = null;
        this.currentListId = null;
        this.isConnected = false;
        
        this.setupRealTimeHandlers();
    }

    // Initialize the collaborative editor
    async init(userId, listId, token) {
        this.currentUserId = userId;
        this.currentListId = listId;
        this.currentRoomId = createRoomId(listId, userId);
        
        // Enable real-time features
        enableRealTime();
        
        // Join collaborative session
        joinCollaborativeSession(this.currentRoomId, token);
        
        console.log(`Initialized collaborative editor for list ${listId} in room ${this.currentRoomId}`);
    }

    // Setup real-time event handlers
    setupRealTimeHandlers() {
        setRealTimeHandlers({
            onRoomJoined: (data) => {
                console.log('Joined room:', data);
                this.isConnected = true;
                this.updateUI();
            },
            
            onUserJoined: (data) => {
                console.log(`${data.username} joined the session`);
                this.showNotification(`${data.username} joined the session`);
                this.updateUserList(data.users);
            },
            
            onUserLeft: (data) => {
                console.log(`${data.username} left the session`);
                this.showNotification(`${data.username} left the session`);
            },
            
            onListUpdated: (data) => {
                console.log('List updated by:', data.username);
                this.handleRemoteUpdate(data);
            },
            
            onUserTyping: (data) => {
                this.showTypingIndicator(data.username, data.isTyping);
            },
            
            onError: (data) => {
                console.error('Real-time error:', data);
                this.showNotification(`Error: ${data.message}`, 'error');
            }
        });
    }

    // Add item to list with real-time sync
    addItem(item) {
        if (!this.isConnected) {
            console.warn('Not connected to real-time session');
            return;
        }

        addItemRealTime(this.currentRoomId, this.currentListId, item);
        
        // Optimistic update
        this.currentList.push(item);
        this.updateUI();
        
        // Start typing indicator
        startTyping(this.currentRoomId);
        setTypingTimeout(this.currentRoomId, 2000);
    }

    // Remove item from list with real-time sync
    removeItem(index) {
        if (!this.isConnected) {
            console.warn('Not connected to real-time session');
            return;
        }

        removeItemRealTime(this.currentRoomId, this.currentListId, index);
        
        // Optimistic update
        this.currentList.splice(index, 1);
        this.updateUI();
        
        startTyping(this.currentRoomId);
        setTypingTimeout(this.currentRoomId, 2000);
    }

    // Update item in list with real-time sync
    updateItem(index, newItem) {
        if (!this.isConnected) {
            console.warn('Not connected to real-time session');
            return;
        }

        updateItemRealTime(this.currentRoomId, this.currentListId, index, newItem);
        
        // Optimistic update
        this.currentList[index] = newItem;
        this.updateUI();
        
        startTyping(this.currentRoomId);
        setTypingTimeout(this.currentRoomId, 2000);
    }

    // Handle remote updates from other users
    handleRemoteUpdate(data) {
        const { updates, operation } = data;
        
        switch (operation) {
            case 'add_item':
                this.currentList.push(updates.item);
                break;
                
            case 'remove_item':
                this.currentList.splice(updates.itemIndex, 1);
                break;
                
            case 'update_item':
                this.currentList[updates.itemIndex] = updates.item;
                break;
                
            default:
                console.warn('Unknown operation:', operation);
        }
        
        this.updateUI();
        this.showNotification(`List updated by ${data.username}`);
    }

    // Update the UI (placeholder - implement based on your UI framework)
    updateUI() {
        console.log('Current list:', this.currentList);
        // TODO: Update your UI components here
        // Example: renderList(this.currentList);
    }

    // Show typing indicator
    showTypingIndicator(username, isTyping) {
        if (isTyping) {
            console.log(`${username} is typing...`);
            // TODO: Show typing indicator in UI
        } else {
            console.log(`${username} stopped typing`);
            // TODO: Hide typing indicator in UI
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // TODO: Show notification in UI
    }

    // Update user list display
    updateUserList(users) {
        console.log('Active users:', users);
        // TODO: Update user list in UI
    }

    // Get connection status
    getStatus() {
        return getRealTimeStatus();
    }

    // Disconnect from collaborative session
    disconnect() {
        if (this.currentRoomId) {
            leaveCollaborativeSession();
            this.isConnected = false;
            console.log('Disconnected from collaborative session');
        }
    }
}

// Example usage
async function demoCollaborativeEditing() {
    const editor = new CollaborativeListEditor();
    
    // Mock user data (replace with actual authentication)
    const userId = 'user123';
    const listId = 'list456';
    const token = 'mock-jwt-token';
    
    try {
        // Initialize collaborative session
        await editor.init(userId, listId, token);
        
        // Wait for connection
        setTimeout(() => {
            // Demo: Add items collaboratively
            editor.addItem('Buy groceries');
            editor.addItem('Call mom');
            
            // Demo: Update item
            setTimeout(() => {
                editor.updateItem(0, 'Buy groceries (urgent)');
            }, 2000);
            
            // Demo: Remove item
            setTimeout(() => {
                editor.removeItem(1);
            }, 4000);
            
        }, 1000);
        
    } catch (error) {
        console.error('Failed to initialize collaborative editor:', error);
    }
}

// Export for use in other modules
export { CollaborativeListEditor, demoCollaborativeEditing };

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    demoCollaborativeEditing();
} 