import { createContext, useReducer } from "react";

export const EventsContext = createContext({
    events: [],
    addEvent: (event) => {},
    setEvents: (events) => {},
    deleteEvent: (event) => {},
});

function eventsReducer(state, action) {
    switch (action.type) {
        case "ADD":
            return [...state, action.payload].sort((a, b) => (a.data().startTime - b.data().startTime));
        case "SET":
            return action.payload;
        case "DELETE":
            return state.filter((event) => (event.id !== action.payload.id));
        default:
            return state;
    }
}

export default function EventsContextProvider({ children }) {
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
        events: eventsState,
        addEvent: addEvent,
        setEvents: setEvents,
        deleteEvent: deleteEvent,
    }

    return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}