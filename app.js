import { addList, viewList, updateList, deleteList } from "./api";

async function view(){
    const list = await viewList(0);
}

await view();

// need to write a function for the signing in of users so that we can get user IDs in order to know who's who.
// This is necessary for the functions in the API as they use the ID as a parameter.

