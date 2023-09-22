import { createContext, useState } from "react";
import { User } from "../utils/user";

export const UsersContext = createContext({
    users: new Map(),
    addUser: (user: User) => {},
    getUser: null,
});

export default function UsersContextProvider({ children }) {
    const [usersState, setUsersState] = useState(new Map());

    function addUser(user: User) {
        return setUsersState(usersState.set(user.uid, user));
    }

    function getUser(uid: string) {
        return usersState.get(uid);
    }

    const value = {
        users: usersState,
        addUser,
        getUser
    }

    return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}