import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, FlatList } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, addDoc, getDoc, deleteDoc, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { FriendsContext } from '../store/friends-context';
import LoadingOverlay from './LoadingOverlay';



function MyFriendsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const friendsCtx = useContext(FriendsContext);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [addingStatus, setAddingStatus] = useState(false);
    const [newFriendEmail, setNewFriendEmail] = useState("");
    // const [userEvents, setUserEvents] = useState([]);

    function displayFriend({ friendDoc, docId }) {
        const data = friendDoc.data();
        console.log("HELLO ", data.email);
        console.log(data);
        console.log(friendsCtx);
        return (
            <Menu key={friendDoc.id} style={styles.event}>
                <MenuTrigger>
                    <Text style={styles.eventTitle}>{data.email}</Text>
                </MenuTrigger>
                <MenuOptions>
                    <MenuOption text="Remove friend" onSelect={() => deleteFriend({ friendDoc, docId })} />
                </MenuOptions>
            </Menu>
        );
    }

    async function addFriend() {
        setAddingStatus(true);
        const friendEmail = newFriendEmail.trim().toLowerCase();
        const querySnapshot = await getDocs(query(collection(db, "users"), where("email", "==", friendEmail)));
        if (querySnapshot.empty) {
            Alert.alert("No user with that email could be found.");
        }
        else {
            const myUid = authCtx.uid;
            console.log(querySnapshot.docs);
            const newFriendDoc = querySnapshot.docs[0];
            const newFriendUid = newFriendDoc.data().uid;
            if (myUid === newFriendUid) {
                Alert.alert("Can't add yourself as a friend!");
            }
            else if (friendsCtx.friends.some(({ friendDoc, _ }) => (friendDoc.data().uid === newFriendUid))) {
                Alert.alert("This user is already your friend!");
            }
            else {
                const docRef = await addDoc(collection(db, "friends"), { accepted: true, uids: [myUid, newFriendUid] });
                friendsCtx.addFriend({ friendDoc: newFriendDoc, docId: docRef.id });
                setNewFriendEmail("");
                Alert.alert("New friend added!");
            }
        }
        setAddingStatus(false);
    }

    async function deleteFriend({ friendDoc, docId }) {
        console.log(docId);
        await deleteDoc(doc(db, "friends", docId));
        friendsCtx.deleteFriend(friendDoc);
        Alert.alert("Friend successfully removed.")
    }

    // get list of friends from database
    async function getFriends() {
        const myUid = authCtx.uid;
        const q = query(collection(db, "friends"), where("uids", "array-contains", myUid));
        const querySnapshot = await getDocs(q);
        // for each friendship, keep only the other person's uid and remove your own
        const friendUids = querySnapshot.docs.map((doc) => {
            const uidPair = doc.data().uids;
            const filteredUidPair = uidPair.filter((uid: string) => (uid !== myUid));
            if (filteredUidPair.length !== 1) {
                console.error("Unexpected error with friends query");
            }
            else {
                return filteredUidPair[0];
            }
        });
        console.log(friendUids);

        const friendPromises = friendUids.map((uid: string) => getDocs(query(collection(db, "users"), where("uid", "==", uid))));
        const friendSnapshots = await Promise.all(friendPromises);
        const friends = friendSnapshots.map((snapshot, i) => {
            const docs = snapshot.docs;
            if (docs.length === 0) {
                console.error(`No user document found associated with uid ${friendUids[i]}`)
            }
            else if (docs.length > 1) {
                console.error(`Multiple user documents found associated with uid ${friendUids[i]}`);
            }
            else {
                return { friendDoc: docs[0], docId: querySnapshot.docs[i].id } ;
            }
        });
        return friends;
    }

    // load friends upon first opening page
    useEffect(() => {
        async function renderFriends() {
            const friends = await getFriends();
            friendsCtx.setFriends(friends);
            setLoadingStatus(false);
            console.log("Friends: ", friendsCtx.friends);
        }
        renderFriends();
    }, []);

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
                <FlatList data={friendsCtx.friends} renderItem={itemData => displayFriend(itemData.item)} />
            </View>
        </View>
    );
}

export default MyFriendsScreen;

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