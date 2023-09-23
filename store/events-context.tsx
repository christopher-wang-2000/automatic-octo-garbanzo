import { createContext, useReducer } from "react";
import { Event } from "../screens/Events";

export const EventsContext = createContext({
    events: new Array<Event>(),
    addEvent: (event: Event) => {},
    updateEvent: (event: Event) => {},
    deleteEvent: (event: Event) => {},
    setEvents: (events: Array<Event>) => {},
});

function sortEvents(state: Array<Event>) {
    return state.sort((a, b) => (a.startTime.getTime() - b.startTime.getTime()));
}

function eventsReducer(state: Array<Event>, action: { type: string, payload }) {
    switch (action.type) {
        case "ADD":
            return sortEvents([...state, action.payload]);
        case "UPDATE":
            return sortEvents(state.map((event) => {
                if (event.docId === action.payload.docId) {
                    return action.payload;
                }
                return event;
            }));
        case "DELETE":
            return state.filter((event) => (event.docId !== action.payload.docId));
        case "SET":
            return sortEvents(action.payload);
        default:
            return state;
    }
}

export default function EventsContextProvider({ children }) {
    const [eventsState, dispatch] = useReducer(eventsReducer, []);

    function addEvent(event: Event) {
        dispatch({ type: "ADD", payload: event });
    }

    function updateEvent(event: Event) {
        dispatch({ type: "UPDATE", payload: event });
    }

    function deleteEvent(event: Event) {
        dispatch({ type: "DELETE", payload: event });
    }

    function setEvents(events: Array<Event>) {
        dispatch({ type: "SET", payload: events });
    }

    const value = {
        events: eventsState,
        addEvent: addEvent,
        updateEvent: updateEvent,
        deleteEvent: deleteEvent,
        setEvents: setEvents,
    }

    return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}