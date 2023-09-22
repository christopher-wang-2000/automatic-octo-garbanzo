import { createContext, useState } from "react";
import { Friend, FriendStatus } from "../utils/friend";

export const FriendsContext = createContext({
    friends: [],
    addFriend: (friend: Friend) => {},
    updateFriend: (friend: Friend) => {},
    removeFriend: (friend: Friend) => {},
    setFriends: (friends: Array<Friend>) => {},
});

export default function FriendsContextProvider({ children }) {
    const [friendState, setFriendState] = useState([]);

    function addFriend(friend: Friend) {
        setFriendState([...friendState, friend]);
    }

    function updateFriend(updatedFriend: Friend) {
        setFriendState(friendState.map((friend: Friend) => {
            if (friend.uid === updatedFriend.uid) {
                return updatedFriend;
            }
            return friend;
        }));
    }

    function removeFriend(friendToDelete: Friend) {
        setFriendState(friendState.filter((friend: Friend) => (friend.uid !== friendToDelete.uid)));
    }

    function setFriends(friends: Array<Friend>) {
        setFriendState(friends);
    }

    const value = {
        friends: friendState,
        addFriend,
        updateFriend,
        removeFriend,
        setFriends,
    }

    return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
}