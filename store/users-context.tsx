import { createContext, useState } from "react";
import { collection, query, where, doc, addDoc, deleteDoc, updateDoc, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from '../firebase';

import { User } from "../utils/user";
import { Friend, FriendStatus, dummyFriend, createFriendFromDocument } from "../utils/friend";
import { Group } from "../utils/group";

export const UsersContext = createContext({
    friends: new Array<Friend>(),
    groups: new Array<Group> (),
    getUser: (uid: string) => User.makeDummy(),
    loadUser: async (uid: string) => User.makeDummy(),
    loadFriends: async (myUid: string) => new Array<Friend>(),
    sendFriendRequest: async (myUid: string, toUid: string) => dummyFriend,
    acceptFriendRequest: async (friend: Friend) => dummyFriend,
    removeFriend: async (friend: Friend) => {},
    loadGroups: async (myUid: string) => new Array<Group>(),
    createGroup: async (myUid: string, friends: Array<Friend>, title: string, anyoneCanEdit: boolean) => new Group(null),
});

export default function UsersContextProvider({ children }) {
    const [usersState, setUsersState] = useState(new Map());
    const [friendsState, setFriendsState] = useState([]);
    const [groupsState, setGroupsState] = useState([]);

    function getUser(uid: string): User {
        if (usersState.has(uid)) {
            return usersState.get(uid);
        }
    }

    async function loadUser(uid: string): Promise<User> {
        if (usersState.has(uid)) {
            return usersState.get(uid);
        }
        else {
            const user = await User.make(uid);
            if (user !== undefined) {
                setUsersState(usersState.set(user.uid, user));
            }
            return user;
        }
    }

    async function loadFriends(myUid: string): Promise<Friend[]> {
        const q = query(collection(db, "friends"), where("uids", "array-contains", myUid));
        const querySnapshot = await getDocs(q);
        const friends = await Promise.all(querySnapshot.docs.map((doc) => createFriendFromDocument(doc, myUid)));
        await Promise.all(friends.map((friend: Friend) => loadUser(friend.uid)));
        setFriendsState(friends);
        return friends;
    }

    async function sendFriendRequest(myUid: string, toUid: string): Promise<Friend> {
        const docRef = await addDoc(collection(db, "friends"), { accepted: false, uids: [myUid, toUid] });
        await loadUser(toUid);
        const newFriend: Friend = { docId: docRef.id, uid: toUid, status: FriendStatus.Outgoing };
        setFriendsState([...friendsState, newFriend]);
        return newFriend;
    }

    async function acceptFriendRequest(friend: Friend): Promise<Friend> {
        await updateDoc(doc(db, "friends", friend.docId), { accepted: true } );
        friend.status = FriendStatus.Accepted;
        setFriendsState(friendsState.map((f: Friend) => {
            if (f.uid === friend.uid) {
                return friend;
            }
            return f;
        }));
        return friend;
    }
    
    async function removeFriend(friend: Friend): Promise<void> {
        await deleteDoc(doc(db, "friends", friend.docId));
        setFriendsState(friendsState.filter((f: Friend) => (f.uid !== friend.uid)));
    }

    async function loadGroups(myUid: string): Promise<Group[]> {
        const q = query(collection(db, "groups"), where("members", "array-contains", myUid));
        const docs = (await getDocs(q)).docs;
        const groups = docs.map((d) => new Group(d));
        await Promise.all(groups.map((g) => 
            Promise.all(g.members.map(loadUser))
        ));
        setGroupsState(groups);
        return groups;
    }
    
    async function createGroup(myUid: string, friends: Array<Friend>, title: string, anyoneCanEdit: boolean): Promise<Group> {
        const members: Array<string> = [myUid, ...friends.map((f) => f.uid)];
        const admins: Array<string> = [myUid];
        const docRef = await addDoc(collection(db, "groups"), { admins, members, title, anyoneCanEdit });
        const group = await Group.makeFromId(docRef.id);
        setGroupsState([...groupsState, group]);
        return group;
    }

    const value = {
        friends: friendsState,
        groups: groupsState,
        getUser,
        loadUser,
        loadFriends,
        sendFriendRequest,
        acceptFriendRequest,
        removeFriend,
        loadGroups,
        createGroup
    }

    return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}