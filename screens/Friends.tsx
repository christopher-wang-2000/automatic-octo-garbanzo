import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, addDoc, updateDoc, getDoc, deleteDoc, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { UsersContext } from '../store/users-context';
import LoadingOverlay from './LoadingOverlay';

import { User } from '../utils/user';
import { FriendStatus, Friend } from '../utils/friend';


export default function MyFriendsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const usersCtx = useContext(UsersContext);
    const myUid = authCtx.uid;

    const [loadingStatus, setLoadingStatus] = useState(false);
    const [addingStatus, setAddingStatus] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [newFriendEmail, setNewFriendEmail] = useState("");

    async function add() {
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
                const duplicateFriend: Friend|undefined = usersCtx.friends.find(
                    (friend: Friend) => (friend.uid === newFriendUid));
                if (duplicateFriend === undefined) {
                    const newFriend = await usersCtx.sendFriendRequest(myUid, newFriendUid);
                    setNewFriendEmail("");
                    Alert.alert("Friend request sent!");
                }
                else {
                    if (duplicateFriend.status === FriendStatus.Accepted) {
                        Alert.alert("This user is already your friend!");
                    }
                    else if (duplicateFriend.status === FriendStatus.Outgoing) {
                        Alert.alert("You already have a pending outgoing friend request to this user.")
                    }
                    else if (duplicateFriend.status === FriendStatus.Incoming) {
                        await usersCtx.acceptFriendRequest(duplicateFriend);
                    }
                }
            }
        }
        setAddingStatus(false);
    }

    async function accept(friend: Friend) {
        await usersCtx.acceptFriendRequest(friend);
        Alert.alert("Friend request accepted!");
    }

    async function remove(friend: Friend, message: string) {
        await usersCtx.removeFriend(friend);
        Alert.alert(message);
    }

    async function loadFriendsAndRefresh() {
        setRefreshing(true);
        await usersCtx.loadFriends(myUid);
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

    function renderFriend(friend: Friend) {
        function getLabelAndStyle(status: FriendStatus) {
            switch (status) {
                case FriendStatus.Accepted:
                    return { label: "Friend", style: styles.accepted }
                case FriendStatus.Outgoing:
                    return { label: "Request pending", style: styles.outgoing }
                case FriendStatus.Incoming:
                    return { label: "Incoming friend request", style: styles.incoming }
            }
        }
        const { label, style } = getLabelAndStyle(friend.status);
        const user: User = usersCtx.getUser(friend.uid);
        return (
            <Menu key={friend.docId} style={style}>
                <MenuTrigger>
                    <Text style={{fontWeight: "bold"}}>{user?.fullName}</Text>
                    <Text style={{}}>{user?.email}</Text>
                    <Text style={{fontStyle: "italic"}}>{label}</Text>
                </MenuTrigger>
                <MenuOptions>
                    { (friend.status === FriendStatus.Accepted) && <MenuOption text="Remove friend" onSelect={() => { remove(friend, "Friend successfully removed."); }} /> }
                    { (friend.status === FriendStatus.Outgoing) && <MenuOption text="Cancel request" onSelect={() => { remove(friend, "Friend request canceled."); }} />  }
                    { (friend.status === FriendStatus.Incoming) && <MenuOption text="Accept request" onSelect={() => { accept(friend); }} />  }
                    { (friend.status === FriendStatus.Incoming) && <MenuOption text="Delete request" onSelect={() => { remove(friend, "Friend request deleted."); }} />  }
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
                <Button title="Add friend" onPress={add} />
            </View>
            <Text>Scroll up to refresh</Text>
            <View style={styles.friendsContainer}>
                <FlatList data={usersCtx.friends} renderItem={itemData => renderFriend(itemData.item)}
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
});