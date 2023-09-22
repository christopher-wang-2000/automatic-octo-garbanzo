import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, addDoc, updateDoc, getDoc, deleteDoc, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { FriendsContext } from '../store/friends-context';
import LoadingOverlay from './LoadingOverlay';

export enum RequestStatus { Incoming, Accepted, Outgoing };

export async function loadFriends(myUid: string): Promise<Friend[]> {
    const q = query(collection(db, "friends"), where("uids", "array-contains", myUid));
    const querySnapshot = await getDocs(q);
    const friends = await Promise.all(querySnapshot.docs.map((doc) => Friend.make(doc, myUid)));
    return friends;
}

export class Friend {
    public constructor(
        public readonly userData: DocumentData,
        public readonly friendshipDocId: string,
        public status: RequestStatus) { }

    static async make(friendshipDoc: QueryDocumentSnapshot<DocumentData, DocumentData>, myUid: string) {
        // get uid of friend from friendship document
        const data = friendshipDoc.data();
        const uidPair = data.uids;
        if (uidPair.length !== 2) {
            console.error("Unexpected format of friendship document");
            return null;
        }

        let status = RequestStatus.Accepted;
        let friendUid: string = "";
        if (uidPair[0] === myUid && uidPair[1] !== myUid) {
            friendUid = uidPair[1];
            status = data.accepted ? RequestStatus.Accepted : RequestStatus.Outgoing;
        }
        else if (uidPair[0] !== myUid && uidPair[1] === myUid) {
            friendUid = uidPair[0];
            status = data.accepted ? RequestStatus.Accepted : RequestStatus.Incoming;
        }
        else {
            console.error("Unexpected format of friendship document");
            return null;
        }

        // get user doc of friend
        const snapshot = await getDocs(query(collection(db, "users"), where("uid", "==", friendUid)));
        const docs = snapshot.docs;
        if (docs.length === 0) {
            console.error(`No user document found associated with uid ${friendUid}`);
        }
        else if (docs.length > 1) {
            console.error(`Multiple user documents found associated with uid ${friendUid}`);
        }
        else {
            return new Friend(docs[0].data(), friendshipDoc.id, status);
        }
    }

    static async create(friendData: DocumentData, fromUid: string, toUid: string) {
        const docRef = await addDoc(collection(db, "friends"), { accepted: false, uids: [fromUid, toUid] });
        return new Friend(friendData, docRef.id, RequestStatus.Outgoing);
    }

    async remove() {
        await deleteDoc(doc(db, "friends", this.friendshipDocId));
    }

    async accept() {
        await updateDoc(doc(db, "friends", this.friendshipDocId), { accepted: true } );
        this.status = RequestStatus.Accepted;
        return this;
    }

    get uid() {
        return this.userData.uid;
    }

    get email() {
        return this.userData.email;
    }

    get name() {
        return this.userData.fullName;
    }

    get firstName() {
        return this.userData.firstName;
    }
    
    get lastName() {
        return this.userData.lastName;
    }
}

export default function MyFriendsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const friendsCtx = useContext(FriendsContext);
    const myUid = authCtx.uid;

    const [loadingStatus, setLoadingStatus] = useState(false);
    const [addingStatus, setAddingStatus] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [newFriendEmail, setNewFriendEmail] = useState("");

    async function addFriend() {
        setAddingStatus(true);
        const friendEmail = newFriendEmail.trim().toLowerCase();
        const querySnapshot = await getDocs(query(collection(db, "users"), where("email", "==", friendEmail)));
        if (querySnapshot.empty) {
            Alert.alert(`No user with email \"${friendEmail}\" could be found.`);
        }
        else {
            const friendData = querySnapshot.docs[0].data();
            const newFriendUid = friendData.uid;
            if (myUid === newFriendUid) {
                Alert.alert("Can't add yourself as a friend!");
            }
            else {
                // see if user already exists as friend
                const duplicateFriend: Friend|undefined = friendsCtx.friends.find((friend) => (friend.uid === newFriendUid));
                if (duplicateFriend === undefined) {
                    friendsCtx.addFriend(await Friend.create(friendData, myUid, newFriendUid));
                    setNewFriendEmail("");
                    Alert.alert("Friend request sent!");
                }
                else {
                    if (duplicateFriend.status === RequestStatus.Accepted) {
                        Alert.alert("This user is already your friend!");
                    }
                    else if (duplicateFriend.status === RequestStatus.Incoming) {
                        acceptRequest(duplicateFriend);
                    }
                    else if (duplicateFriend.status === RequestStatus.Outgoing) {
                        Alert.alert("You already have a pending outgoing friend request to this user.")
                    }
                }
            }
        }
        setAddingStatus(false);
    }

    async function loadFriendsAndRefresh() {
        setRefreshing(true);
        const friends = await loadFriends(myUid);
        friendsCtx.setFriends(friends);
        setRefreshing(false);
    }

    useEffect(() => {
        async function loadFriendsAndWait() {
            setLoadingStatus(true);
            await loadFriendsAndRefresh();
            setLoadingStatus(false);
        }
        loadFriendsAndWait();
    }, []);

    async function removeFriend(friend: Friend, message: string) {
        friend.remove();
        friendsCtx.deleteFriend(friend);
        Alert.alert(message)
    }

    async function acceptRequest(friend: Friend) {
        await friend.accept();
        friendsCtx.updateFriend(friend);
        Alert.alert("Friend request accepted!");
    }

    function renderFriend(friend: Friend) {
        function getLabelAndStyle(status: RequestStatus) {
            switch (status) {
                case RequestStatus.Accepted:
                    return { label: "Friend", style: styles.accepted }
                case RequestStatus.Outgoing:
                    return { label: "Request pending", style: styles.outgoing }
                case RequestStatus.Incoming:
                    return { label: "Incoming friend request", style: styles.incoming }
            }
        }
        const { label, style } = getLabelAndStyle(friend.status);
        return (
            <Menu key={friend.friendshipDocId} style={style}>
                <MenuTrigger>
                    <Text style={styles.friendName}>{friend.userData.email}</Text>
                    <Text style={styles.friendStatus}>{label}</Text>
                </MenuTrigger>
                <MenuOptions>
                    { (friend.status === RequestStatus.Accepted) && <MenuOption text="Remove friend" onSelect={() => { removeFriend(friend, "Friend successfully removed."); }} /> }
                    { (friend.status === RequestStatus.Outgoing) && <MenuOption text="Cancel request" onSelect={() => { removeFriend(friend, "Friend request canceled."); }} />  }
                    { (friend.status === RequestStatus.Incoming) && <MenuOption text="Accept request" onSelect={() => { acceptRequest(friend); }} />  }
                    { (friend.status === RequestStatus.Incoming) && <MenuOption text="Delete request" onSelect={() => { removeFriend(friend, "Friend request deleted."); }} />  }
                </MenuOptions>
            </Menu>
        );
    }

    if (loadingStatus) {
        return <LoadingOverlay message="Loading friends..." />
    }
    else if (addingStatus) {
        return <LoadingOverlay message="Sending a friend request..." />
    }

    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>My Friends</Text>
            <View style={styles.addFriend}>
                <Input placeholder="Enter email here" onChangeText={setNewFriendEmail} />
                <Button title="Add friend" onPress={addFriend} />
            </View>
            <Text>Scroll up to refresh</Text>
            <View style={styles.friendsContainer}>
                <FlatList data={friendsCtx.friends} renderItem={itemData => renderFriend(itemData.item)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadFriendsAndRefresh(); }} />}
                    />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    addFriend: {
        flexDirection: "row",
        width: "80%",
        justifyContent: "center"
    },
    friendsContainer: {
        flex: 14,
        padding: 10,
        borderColor: "grey",
        borderWidth: 1,
        width: "80%"
    },
    accepted: {
        marginVertical: 5,
        padding: 10,
        backgroundColor: "lightgreen",
        borderRadius: 15
    },
    outgoing: {
        marginVertical: 5,
        padding: 10,
        backgroundColor: "lightblue",
        borderRadius: 15
    },
    incoming: {
        marginVertical: 5,
        padding: 10,
        backgroundColor: "orange",
        borderRadius: 15
    },
    friendName: {
        fontWeight: "bold",
    },
    friendStatus: {
        fontStyle: "italic",
    }
});