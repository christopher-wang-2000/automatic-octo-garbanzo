import axios from 'axios';

const API_KEY = 'AIzaSyBu9aKJH7CmvYC1JatUN8uuUCAc7z9_jtI';

async function authenticate(email: string, password: string, newAccount: boolean) {
    const url = newAccount ? 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' : "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
    const response = await axios.post(
        url + API_KEY, 
        {
            email: email,
            password: password,
            returnSecureToken: true
        }
    );
    const token = response.data.idToken;
    const uid = response.data.localId;
    console.assert(email === response.data.email, "ERROR: Email returned from request does not equal submitted email!");
    return { token, uid };
}

export function register(email: string, password: string) {
    return authenticate(email, password, true);
}

export function login(email: string, password: string) {
    return authenticate(email, password, false);
}