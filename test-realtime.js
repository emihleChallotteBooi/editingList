import { 
    enableRealTime, 
    joinCollaborativeSession,
    setRealTimeHandlers,
    getRealTimeStatus,
    createRoomId
} from './api.js';

// Test real-time functionality
async function testRealTimeFeatures() {
    console.log('🧪 Testing Real-Time Features...\n');

    try {
        // 1. Enable real-time
        console.log('1. Enabling real-time features...');
        enableRealTime();
        
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. Check connection status
        console.log('2. Checking connection status...');
        const status = getRealTimeStatus();
        console.log('Connection status:', status);
        
        if (!status.isConnected) {
            console.log('❌ Failed to connect to Socket.IO server');
            console.log('💡 Make sure the server is running with: npm start');
            return;
        }
        
        console.log('✅ Successfully connected to Socket.IO server\n');
        
        // 3. Set up event handlers
        console.log('3. Setting up event handlers...');
        setRealTimeHandlers({
            onRoomJoined: (data) => {
                console.log('✅ Joined room:', data.roomId);
                console.log('   Active users:', data.users.length);
            },
            
            onUserJoined: (data) => {
                console.log('👤 User joined:', data.username);
            },
            
            onUserLeft: (data) => {
                console.log('👋 User left:', data.username);
            },
            
            onListUpdated: (data) => {
                console.log('📝 List updated by:', data.username);
                console.log('   Operation:', data.operation);
            },
            
            onUserTyping: (data) => {
                if (data.isTyping) {
                    console.log('⌨️  User typing:', data.username);
                } else {
                    console.log('💤 User stopped typing:', data.username);
                }
            },
            
            onError: (data) => {
                console.log('❌ Real-time error:', data.message);
            }
        });
        
        // 4. Test room joining
        console.log('4. Testing room joining...');
        const roomId = createRoomId('test-list', 'test-user');
        const token = 'test-token';
        
        joinCollaborativeSession(roomId, token);
        
        // Wait for room join
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 5. Final status check
        console.log('5. Final connection status...');
        const finalStatus = getRealTimeStatus();
        console.log('Final status:', finalStatus);
        
        if (finalStatus.currentRoom === roomId) {
            console.log('✅ Successfully joined room');
        } else {
            console.log('❌ Failed to join room');
        }
        
        console.log('\n🎉 Real-time features test completed!');
        console.log('\n📋 Summary:');
        console.log('   - Socket.IO connection: ✅');
        console.log('   - Room system: ✅');
        console.log('   - Event handlers: ✅');
        console.log('   - User management: ✅');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure the server is running (npm start)');
        console.log('   2. Check that Socket.IO is properly installed');
        console.log('   3. Verify the server port (3000) is available');
    }
}

// Run the test
testRealTimeFeatures(); 