import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, TextInput, FlatList } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { RoundedCheckbox } from 'react-native-rounded-checkbox';

import { collection, query, where, doc, getDocs, addDoc, getDoc, updateDoc } from "firebase/firestore";

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';
import { UsersContext } from '../store/users-context';
import LoadingOverlay from './LoadingOverlay';

import { Friend, FriendStatus } from '../utils/friend';
import { Group } from '../utils/group';

export default function CreateGroupScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const usersCtx = useContext(UsersContext);
    const myUid: string = authCtx.uid;

    const [title, setTitle] = useState("");
    const [loadingMessage, setLoadingMessage] = useState("");
    const [friendsInGroup, setFriendsInGroup] = useState([]);

    function renderFriendSelect(friend: Friend) {
        return (
            <View id={friend.docId} style={{flexDirection: "row", backgroundColor: "white", borderRadius: 20, margin: 5, alignItems: "center" }}>
                <Text style={{flex: 1, marginLeft: 15, fontSize: 16}}>{usersCtx.getUser(friend.uid).fullName}</Text>
                <RoundedCheckbox innerStyle={{height: "60%", width: "60%"}} text={""} uncheckedColor={"lightgray"} onPress={(checked) => {
                    if (checked) {
                        setFriendsInGroup([...friendsInGroup, friend]);
                    } else {
                        setFriendsInGroup(friendsInGroup.filter((f) => (f.uid !== friend.uid)));
                    }
                }} />
            </View>
        )
    }

    async function create() {
        setLoadingMessage("Creating group...")
        if (!title) {
            Alert.alert("Must enter a group name!");
            setLoadingMessage("");
            return;
        }
        if (friendsInGroup.length === 0) {
            Alert.alert("Must add others to this group!");
            setLoadingMessage("");
            return;
        }
        const anyoneCanEdit = true;
        await usersCtx.createGroup(myUid, friendsInGroup, title, anyoneCanEdit);
        setLoadingMessage("");
        navigation.navigate("My Groups");
    }

    if (loadingMessage) {
        return <LoadingOverlay message={loadingMessage} />
    }
    return (
        <View style={styles.rootContainer}>
            <Input placeholder="Group name" defaultValue={title} onChangeText={setTitle} />
            <Button title="Create" style={{marginBottom: 15}} onPress={create} />
            <Text style={{fontSize: 18, fontWeight: "bold"}}>Add friends:</Text>
            <View style={styles.friendsContainer}>
                <FlatList data={usersCtx.friends} renderItem={itemData => renderFriendSelect(itemData.item)} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        padding: 32,
    },
    eventTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    timeContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    timeText: {
        fontSize: 17
    },
    eventDescription: {
        flex: 4,
        borderWidth: 1,
        borderColor: "black",
        padding: 8
    },
    friendsContainer: {
        borderColor: "black",
        borderWidth: 1,
        flex: 1,
        padding: 10
    }
});