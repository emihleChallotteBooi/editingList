const url = 'http://localhost:3000';

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