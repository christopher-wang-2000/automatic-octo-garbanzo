import { createContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
    token: '',
    isAuthenticated: false,
    email: null,
    uid: null,
    authenticate: (token: string|null, email: string|null, uid: string|null) => { },
    logout: () => { },
});

export default function AuthContextProvider({ children }) {
    const [authToken, setAuthToken] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [userId, setUserId] = useState(null);

    function authenticate(token: string|null, email: string, uid: string) {
        setAuthToken(token);
        setUserEmail(email);
        setUserId(uid);
        AsyncStorage.setItem('token', token);
        AsyncStorage.setItem('email', email);
        AsyncStorage.setItem('uid', uid);
    }

    function logout() {
        setAuthToken(null);
        setUserEmail(null);
        setUserId(null);
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('email');
        AsyncStorage.removeItem('uid');
    }

    const value = {
        token: authToken,
        isAuthenticated: !!authToken,
        email: userEmail,
        uid: userId,
        authenticate: authenticate,
        logout: logout
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}