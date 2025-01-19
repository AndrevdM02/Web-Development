async function getUsers() {
    const response = await fetch('http://192.145.146.90:18223/api/users', {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function checkIfExists(user_name: string, email: string) {
    const response = await fetch('http://192.145.146.90:18223/api/users/exists', {
        method: 'POST',
        body: JSON.stringify({user_name, email}),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const data = await response.json();
    console.log(data);
    return data;
}

async function getUserById(user_id: number) {
    const response = await fetch(('http://192.145.146.90:18223/api/users/' + user_id), {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getUserByEmail(email: string) {
    const response = await fetch(`http://192.145.146.90:18223/api/users/info/${email}`);
    const data = await response.json();
    console.log(data);
    return data;
}

async function getSession() {
    const response = await fetch('http://192.145.146.90:18223/auth/session' , {method: "GET", credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function login(user_name:string, password:string, csrfToken?:string) {
    let login_str = '';
    if (csrfToken === undefined) {
        login_str = '&user_name='.concat(user_name,'&password=',password);
    } else {
        login_str = 'csrfToken='.concat(csrfToken,'&user_name=',user_name,'&password=',password);
    }
    const response: Response = await fetch('http://192.145.146.90:18223/auth/callback/credentials', {
        method: 'POST',
        credentials: "include" as RequestCredentials,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: login_str as BodyInit,
        // redirect: "manual",
    })
    return response
}

// async function getUserByEmail(email: string, password: string) {
//     // Password will be used to match with the password on the data base.
//     const response = await fetch('http://192.145.146.90:18223/api/users/' + email);
//     const data = await response.json();
//     console.log(data);
//     return data.user_id;
// }

async function createUser(user_name: string, password: string, email: string) {
    const response = await fetch('http://192.145.146.90:18223/api/users/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_name, password, email})
    });
    const data = await response.json();
    return data.user_id;
}

async function deleteUser(user_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/users/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id})
    });
    const data = await response.json();

    return data;
}

async function createUserImage(user_id: number, image_url: string) {
    const response = await fetch('http://192.145.146.90:18223/api/users/image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id: user_id, image_url: image_url})
    });
    const data = await response.json();

    return data;
}

async function getDisplayInfo(user_name: string) {
    const response = await fetch(('http://192.145.146.90:18223/api/users/displayInfo/' + user_name), {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function updateUserInfo(user_id: number, user_name: string, email: string) {
    const response = await fetch('http://192.145.146.90:18223/api/users/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, user_name, email})
    });
    const data = await response.json();

    return data;
}

async function updateUserPassword(user_id: number, password: string) {
    const response = await fetch('http://192.145.146.90:18223/api/users/password_update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, password})
    })
}

async function getNotes() {
    const response = await fetch('http://192.145.146.90:18223/api/notes', {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getNoteById(note_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/notes/noteId/' + note_id, {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getNoteByName(user_id: number, name: string, bookId: number) {
    const category = bookId === -1 ? null : bookId;
    if (category === null) {
        const response = await fetch(`http://192.145.146.90:18223/api/notes/${user_id}/${name}`, {credentials: "include" as RequestCredentials});
        const data = await response.json();
        console.log(data);
        return data;
    } else {
        const response = await fetch(`http://192.145.146.90:18223/api/notes/${user_id}/${name}/${category}`, {credentials: "include" as RequestCredentials});
        const data = await response.json();
        console.log(data);
        return data;
    }
}

async function getNotesForBooks(user_id: number, category: number) {
    const response = await fetch(`http://192.145.146.90:18223/api/notes/books/${user_id}/${category}`, {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getNotesByOwnerId(user_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/notes/owner/' + user_id, {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function createNote(userId: number, title: string, bookId: number) {
    const response = await fetch('http://192.145.146.90:18223/api/notes/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id: userId, note_name: title, category: bookId === -1 ? null : bookId})
    });
    const data = await response.json();

    return data;
}

async function deleteNote(user_id: number, note_name: string, bookId: number) {
    const response = await fetch('http://192.145.146.90:18223/api/notes/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, note_name, category: bookId === -1 ? null : bookId})
    });
    const data = await response.json();

    return data;
}

async function updateNote(user_id: number, bookId: number, old_name: string, new_name: string) {
    const response = await fetch('http://192.145.146.90:18223/api/notes/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, category: bookId === -1 ? null : bookId, old_name, new_name})
    });
    const data = await response.json();

    return data;
}

async function saveNote(user_id: number, note_id: number, content: string) {
    const response: Response = await fetch('http://192.145.146.90:18223/api/notes/save', {
        method: 'POST',
        credentials: "include" as RequestCredentials,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({user_id, note_id, content})
    });
    const data = await response.json();

    return data;
}

async function saveSharedNote(note_id: number, content: string) {
    const response = await fetch('http://192.145.146.90:18223/api/notes/shared/save', {
        method: 'POST',
        credentials: "include" as RequestCredentials,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({note_id, content})
    });
    const data = await response.json();

    return data;
}

async function getCategories() {
    const response = await fetch('http://192.145.146.90:18223/api/categories', {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getCategoryByUserId(user_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/categories/' + user_id, {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getCategoryByName(user_id: number, category_name: string) {
    const response = await fetch(`http://192.145.146.90:18223/api/categories/${user_id}/${category_name}`, {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getCategoryById(category_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/categories/shared/' + category_id);
    const data = await response.json();
    console.log(data);
    return data;
}

async function createCategory(user_id: number, category_name: string) {
    const response = await fetch('http://192.145.146.90:18223/api/categories/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, category_name})
    });
    const data = await response.json();

    return data;
}

async function deleteCategory(user_id: number, category_name: string) {
    const response = await fetch('http://192.145.146.90:18223/api/categories/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, category_name})
    });
    const data = await response.json();

    return data;
}

async function updateCategoryName(user_id: number, category_name: string, new_category_name: string) {
    const response = await fetch('http://192.145.146.90:18223/api/categories/update_name', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, category_name, new_category_name})
    });
    const data = await response.json();

    return data;
}

async function moveNote(user_id: number, note_name: string, bookId: number) {
    const response = await fetch('http://192.145.146.90:18223/api/notes/move_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, note_name, category: bookId === -1 ? null : bookId})
    });
    const data = await response.json();

    return data;
}

async function getSharedNotes(user_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/shared_notes', {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getSharedNotesByUserID(user_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/shared_notes/user/' + user_id, {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getSharedNotesByNoteID(note_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/shared_notes/note/' + note_id, {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function getSharedNotesByUserIDAndNoteID(user_id: number, note_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/shared_notes/user/' + user_id + '/note/' + note_id, {credentials: "include" as RequestCredentials});
    const data = await response.json();
    console.log(data);
    return data;
}

async function createSharedNote(user_id: number, note_id: number) {
    const response = await fetch('http://192.145.146.90:18223/api/shared_notes/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id, note_id})
    });
    const data = await response.json();
    return data;
}

async function removeSharedNote(user_id: number, note_id:number) {
    const response = await fetch('http://192.145.146.90:18223/api/shared_notes/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: "include" as RequestCredentials,
        body: JSON.stringify({user_id: user_id, note_id: note_id})
    });
    const data = await response.json();
    return data;
}









export { getUsers, getUserById, getUserByEmail, createUser, deleteUser, createUserImage, getDisplayInfo, updateUserInfo, updateUserPassword,
    getNotes, getNoteById, getNotesByOwnerId, getNoteByName, createNote, deleteNote, updateNote,
    getCategories, getCategoryByUserId, createCategory, deleteCategory, updateCategoryName,getCategoryById,
    login, getNotesForBooks, saveNote, saveSharedNote, moveNote, getCategoryByName, removeSharedNote, getSession,
    getSharedNotes, getSharedNotesByUserID, getSharedNotesByNoteID, getSharedNotesByUserIDAndNoteID, createSharedNote, checkIfExists };
