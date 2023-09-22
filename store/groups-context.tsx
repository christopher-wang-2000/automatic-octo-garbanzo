import { createContext, useState } from "react";
import { Group } from "../utils/group";

export const GroupsContext = createContext({
    groups: [],
    addGroup: (group: Group) => {},
    removeGroup: (group: Group) => {},
    setGroups: (groups: Array<Group>) => {},
});

export default function GroupsContextProvider({ children }) {
    const [groupState, setGroupState] = useState([]);

    function addGroup(group: Group) {
        setGroupState([...groupState, group]);
    }

    function removeGroup(group: Group) {
        setGroupState(groupState.filter((g) => (group.docId !== g.docId)));
    }

    function setGroups(groups: Array<Group>) {
        setGroupState(groups);
    }

    const value = {
        groups: groupState,
        addGroup,
        removeGroup,
        setGroups
    }

    return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
}