import { createContext, useReducer } from "react";

export const FriendsContext = createContext({
    friends: [],
    addFriend: (friend) => {},
    setFriends: (friends) => {},
    deleteFriend: (friend) => {},
});

function eventsReducer(state, action) {
    switch (action.type) {
        case "ADD":
            return [...state, action.payload];
        case "SET":
            console.log("Payload: ", action.payload);
            return action.payload;
        case "DELETE":
            return state.filter((friend) => (friend.id !== action.payload.id));
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