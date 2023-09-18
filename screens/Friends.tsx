import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, FlatList } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, addDoc, getDoc, deleteDoc, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { FriendsContext } from '../store/friends-context';
import LoadingOverlay from './LoadingOverlay';

export class Friend {

    public constructor(
        public readonly userData: DocumentData,
        public readonly friendshipDocId: string){ }

    static async make(friendshipDoc: QueryDocumentSnapshot<DocumentData, DocumentData>, myUid: string) {
        // get uid of friend from friendship document
        const uidPair = friendshipDoc.data().uids;
        const filteredUidPair = uidPair.filter((uid: string) => (uid !== myUid));
        if (filteredUidPair.length !== 1) {
            console.error("Unexpected error with friends query");
            return null;
        }
        // get user doc of friend
        const friendUid = filteredUidPair[0];
        const snapshot = await getDocs(query(collection(db, "users"), where("uid", "==", friendUid)));
        const docs = snapshot.docs;
        if (docs.length === 0) {
            console.error(`No user document found associated with uid ${friendUid}`);
        }
        else if (docs.length > 1) {
            console.error(`Multiple user documents found associated with uid ${friendUid}`);
        }
        else {
            return new Friend(docs[0].data(), friendshipDoc.id);
        }
    }

    static async create(friendData: DocumentData, fromUid: string, toUid: string) {
        const docRef = await addDoc(collection(db, "friends"), { accepted: true, uids: [fromUid, toUid] });
        return new Friend(friendData, docRef.id);
    }

    async remove() {
        await deleteDoc(doc(db, "friends", this.friendshipDocId));
    }

    get uid() {
        return this.userData.uid;
    }

    get email() {
        return this.userData.email;
    }
}

export default function MyFriendsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const friendsCtx = useContext(FriendsContext);
    const myUid = authCtx.uid;

    const [loadingStatus, setLoadingStatus] = useState(false);
    const [addingStatus, setAddingStatus] = useState(false);
    const [newFriendEmail, setNewFriendEmail] = useState("");
    // const [userEvents, setUserEvents] = useState([]);

    async function addFriend() {
        setAddingStatus(true);
        const friendEmail = newFriendEmail.trim().toLowerCase();
        const querySnapshot = await getDocs(query(collection(db, "users"), where("email", "==", friendEmail)));
        if (querySnapshot.empty) {
            Alert.alert("No user with that email could be found.");
        }
        else {
            console.log(querySnapshot.docs);
            const friendData = querySnapshot.docs[0].data();
            const newFriendUid = friendData.uid;
            if (myUid === newFriendUid) {
                Alert.alert("Can't add yourself as a friend!");
            }
            else if (friendsCtx.friends.some((friend) => (friend.uid === newFriendUid))) {
                Alert.alert("This user is already your friend!");
            }
            else {
                friendsCtx.addFriend(await Friend.create(friendData, myUid, newFriendUid));
                setNewFriendEmail("");
                Alert.alert("New friend added!");
            }
        }
        setAddingStatus(false);
    }

    // load friends into context upon first opening page
    async function loadFriends() {
        setLoadingStatus(true);
        const myUid = authCtx.uid;
        const q = query(collection(db, "friends"), where("uids", "array-contains", myUid));
        const querySnapshot = await getDocs(q);
        const friends = await Promise.all(querySnapshot.docs.map((doc) => Friend.make(doc, myUid)));
        friendsCtx.setFriends(friends);
        setLoadingStatus(false);
    }
    useEffect(() => { loadFriends(); }, []);

    async function removeFriend(friend: Friend) {
        friend.remove();
        friendsCtx.deleteFriend(friend);
        Alert.alert("Friend successfully removed.")
    }

    function renderFriend(friend: Friend) {
        return (
            <Menu key={friend.friendshipDocId} style={styles.event}>
                <MenuTrigger>
                    <Text style={styles.eventTitle}>{friend.userData.email}</Text>
                </MenuTrigger>
                <MenuOptions>
                    <MenuOption text="Remove friend" onSelect={() => { removeFriend(friend); }} />
                </MenuOptions>
            </Menu>
        );
    }

    if (loadingStatus) {
        return <LoadingOverlay message="Loading friends..." />
    }
    else if (addingStatus) {
        return <LoadingOverlay message="Adding new friend..." />
    }

    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>My Friends</Text>
            <View style={styles.createEvent}>
                <Input placeholder="Enter email here" onChangeText={setNewFriendEmail} />
                <Button title="Add friend" onPress={addFriend} />
            </View>
            <View style={styles.eventsContainer}>
                <FlatList data={friendsCtx.friends} renderItem={itemData => renderFriend(itemData.item)} />
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
    createEvent: {
        marginBottom: 10,
        flexDirection: "row",
        width: "80%",
        justifyContent: "center"
    },
    eventsContainer: {
        flex: 14,
        padding: 10,
        borderColor: "grey",
        borderWidth: 1
    },
    event: {
        marginVertical: 5,
        padding: 10,
        backgroundColor: "lightgreen",
        borderRadius: 15
    },
    eventTitle: {
        fontWeight: "bold",
    },
    eventStartTime: {
        fontStyle: "italic",
        marginBottom: 5
    },
    eventDescription: {

    }
});