import { createContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
    token: '',
    isAuthenticated: false,
    authenticate: (token: string|null) => { },
    logout: () => { },
});

export default function AuthContextProvider({ children }) {
    const [authToken, setAuthToken] = useState(null);

    function authenticate(token: string|null) {
        setAuthToken(token);
        AsyncStorage.setItem('token', token);
    }

    function logout() {
        setAuthToken(null);
        AsyncStorage.removeItem('token');
    }

    const value = {
        token: authToken,
        isAuthenticated: !!authToken,
        authenticate: authenticate,
        logout: logout
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}