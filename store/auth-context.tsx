import { createContext, useState } from 'react';
import { GoogleSignin, User } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
    token: '',
    isAuthenticated: false,
    email: '',
    uid: '',
    googleUserInfo: null,
    authenticate: (token: string | null, email: string | null, uid: string | null) => { },
    logout: () => { },
    googleLogin: async () => null,
    googleLogout: async () => false,
});

export default function AuthContextProvider({ children }) {
    const [authToken, setAuthToken] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [userId, setUserId] = useState(null);
    const [googleUserInfo, setGoogleUserInfo] = useState(null);
    const [firstName, setFirstName] = useState(null);
    const [lastName, setLastName] = useState(null);

    function authenticate(token: string | null, email: string, uid: string) {
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

    async function googleLogin(): Promise<User> {
        try {
            const userInfo = await GoogleSignin.signIn();
            setGoogleUserInfo(userInfo);
            console.log(userInfo);
            return userInfo;
        }
        catch (error) {
            console.error(error);
            return undefined;
        }
    }

    async function googleLogout(): Promise<boolean> {
        try {
            await GoogleSignin.signOut();
            setGoogleUserInfo(null);
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }

    const value = {
        token: authToken,
        isAuthenticated: !!authToken,
        email: userEmail,
        uid: userId,
        googleUserInfo: null,
        authenticate,
        logout,
        googleLogin,
        googleLogout,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}