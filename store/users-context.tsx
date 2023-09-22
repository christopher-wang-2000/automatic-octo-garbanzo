import { createContext, useState } from "react";
import { User } from "../utils/user";

export const UsersContext = createContext({
    users: new Map(),
    addUser: (user: User) => {},
    getUser: null,
    loadUserAsync: null,
});

export default function UsersContextProvider({ children }) {
    const [usersState, setUsersState] = useState(new Map());

    function addUser(user: User): void {
        setUsersState(usersState.set(user.uid, user));
    }

    function getUser(uid: string): User {
        if (usersState.has(uid)) {
            return usersState.get(uid);
        }
    }

    async function loadUserAsync(uid: string): Promise<User> {
        if (usersState.has(uid)) {
            return usersState.get(uid);
        }
        else {
            const user = await User.make(uid);
            if (user !== undefined) {
                addUser(user);
            }
            return user;
        }
    }

    const value = {
        users: usersState,
        addUser,
        getUser,
        loadUserAsync
    }

    return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}