import { createContext, useReducer } from "react";

export const EventsContext = createContext({
    events: [],
    addEvent: (event) => {},
    setEvents: (events) => {},
});

function eventsReducer(state, action) {
    switch (action.type) {
        case "ADD":
            return [...state, action.payload];
        case "SET":
            return action.payload;
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

    const value = {
        events: eventsState,
        addEvent: addEvent,
        setEvents: setEvents,
    }

    return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}