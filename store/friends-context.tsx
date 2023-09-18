import { createContext, useReducer } from "react";

import { RequestStatus } from "../screens/Friends";
import { Friend } from "../screens/Friends";

function sortFriends(friends: Array<Friend>) {
    return friends.sort((a, b) => {
        if (a.status === b.status) {
            if (a.email < b.email) {
                return -1;
            }
            else if (a.email === b.email) {
                return 0;
            }
            else {
                return 1;
            }
        }
        else {
            return a.status - b.status;
        }
    });
}

export const FriendsContext = createContext({
    friends: [],
    addFriend: (friend: Friend) => {},
    updateFriend: (friend: Friend) => {},
    deleteFriend: (friend: Friend) => {},
    setFriends: (friends: Array<Friend>) => {},
});

function eventsReducer(state: Array<Friend>, action: { type: string, payload }) {
    const key = (friend: Friend) => friend.email;

    let newState: Array<Friend> = state;
    switch (action.type) {
        case "ADD":
            newState = [...state, action.payload];
            break;
        case "UPDATE":
            newState = state.map((friend) => {
                if (friend.uid === action.payload.uid) {
                    return action.payload;
                }
                return friend;
            });
            break;
        case "DELETE":
            newState = state.filter((friend) => (friend.uid !== action.payload.uid));
            break;
        case "SET":
            newState = action.payload;
            break;
    }
    return sortFriends(newState);
}

export default function FriendsContextProvider({ children }) {
    const [friendState, dispatch] = useReducer(eventsReducer, []);

    function addFriend(friend: Friend) {
        dispatch({ type: "ADD", payload: friend });
    }

    function updateFriend(friend: Friend) {
        dispatch({ type: "UPDATE", payload: friend });
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
        updateFriend,
        deleteFriend,
        setFriends,
    }

    return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
}