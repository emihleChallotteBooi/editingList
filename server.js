//Server implementation using pure node.js. Why? Because I'm a masochist of course!
import admin from 'firebase-admin';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import serviceAccount from './serviceAccountKey.json';
import http from 'http';
import {parse} from 'url'; // Helps extract different parts of a URL (like path and query string)

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
    console.log('The server is up and running.')
})