import { createContext, useReducer } from "react";

import { Friend } from "../screens/Friends";

function sortFriends(friends: Array<Friend>, key) {
    return friends.sort((a, b) => {
        const keyA = key(a);
        const keyB = key(b);
        if (keyA < keyB) {
            return -1;
        }
        else if (keyA === keyB) {
            return 0;
        }
        else {
            return 1;
        }
    });
}

export const FriendsContext = createContext({
    friends: [],
    addFriend: (friend: Friend) => {},
    deleteFriend: (friend: Friend) => {},
    setFriends: (friends: Array<Friend>) => {},
});

function eventsReducer(state: Array<Friend>, action: { type: string, payload }) {
    const key = (friend: Friend) => friend.email;
    switch (action.type) {
        case "ADD":
            return sortFriends([...state, action.payload], key);
        case "SET":
            return sortFriends(action.payload, key);
        case "DELETE":
            return state.filter((friend) => (friend.uid !== action.payload.uid));
        default:
            return state;
    }
}

export default function FriendsContextProvider({ children }) {
    const [friendState, dispatch] = useReducer(eventsReducer, []);

    function addFriend(friend: Friend) {
        dispatch({ type: "ADD", payload: friend });
    }

    function deleteFriend(friend: Friend) {
        dispatch({ type: "DELETE", payload: friend });
    }

    function setFriends(friends: Array<Friend>) {
        dispatch({ type: "SET", payload: friends });
    }

    const value = {
        friends: friendState,
        addFriend,
        deleteFriend,
        setFriends,
    }

    return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
}