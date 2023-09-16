import axios from 'axios';

const API_KEY = 'AIzaSyBu9aKJH7CmvYC1JatUN8uuUCAc7z9_jtI';

async function authenticate(email: string, password: string, newAccount: boolean) {
    const url = newAccount ? 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' : "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[API_KEY]";
    const response = await axios.post(
        url + API_KEY, 
        {
            email: email,
            password: password,
            returnSecureToken: true
        }
    );
}

export async function register(email: string, password: string) {
    await authenticate(email, password, true);
}

export async function login(email: string, password: string) {
    await authenticate(email, password, false);
}