import { createContext, useReducer } from "react";

function sortFriendDocs(friends) {
    return friends.sort((a, b) => {
        const emailA = a.friendDoc.data().email;
        const emailB = b.friendDoc.data().email;
        if (emailA < emailB) {
            return -1;
        }
        else if (emailA === emailB) {
            return 0;
        }
        else {
            return 1;
        }
    });
}

export const FriendsContext = createContext({
    friends: [],
    addFriend: ({ friendDoc, docId }) => {},
    setFriends: (friends) => {},
    deleteFriend: (friendDoc) => {},
});

function eventsReducer(state, action) {
    console.log(state);
    console.log(action.type);
    console.log("Payload: ", action.payload);
    switch (action.type) {
        case "ADD":
            return sortFriendDocs([...state, action.payload]);
        case "SET":
            return sortFriendDocs(action.payload);
        case "DELETE":
            return state.filter(({ friendDoc, docRef }) => (friendDoc.id !== action.payload.id));
        default:
            return state;
    }
}

export default function FriendsContextProvider({ children }) {
    const [eventsState, dispatch] = useReducer(eventsReducer, []);

    function addEvent(event) {
        dispatch({ type: "ADD", payload: event });
    }

    function setEvents(events) {
        dispatch({ type: "SET", payload: events });
    }

    function deleteEvent(event) {
        dispatch({ type: "DELETE", payload: event });
    }

    const value = {
        friends: eventsState,
        addFriend: addEvent,
        setFriends: setEvents,
        deleteFriend: deleteEvent,
    }

    return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
}