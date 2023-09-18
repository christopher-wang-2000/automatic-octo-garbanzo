import { createContext, useReducer } from "react";

export const EventsContext = createContext({
    events: [],
    addEvent: (event) => {},
    setEvents: (events) => {},
    updateEvent: (event) => {},
    deleteEvent: (event) => {},
});

function sortEvents(state) {
    return state.sort((a, b) => (a.data().startTime - b.data().startTime));
}

function eventsReducer(state, action) {
    switch (action.type) {
        case "ADD":
            return sortEvents([...state, action.payload]);
        case "SET":
            return action.payload;
        case "UPDATE":
            return sortEvents(state.map((event) => {
                if (event.id === action.payload.id) {
                    return action.payload;
                }
                return event;
            }));
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

    function updateEvent(event) {
        dispatch({ type: "UPDATE", payload: event });
    }

    function deleteEvent(event) {
        dispatch({ type: "DELETE", payload: event });
    }

    const value = {
        events: eventsState,
        addEvent: addEvent,
        setEvents: setEvents,
        updateEvent: updateEvent,
        deleteEvent: deleteEvent,
    }

    return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}