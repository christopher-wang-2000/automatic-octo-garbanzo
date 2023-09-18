import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, FlatList } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, addDoc, getDoc, deleteDoc } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { FriendsContext } from '../store/friends-context';

function MyFriendsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const friendsCtx = useContext(FriendsContext);
    // const [userEvents, setUserEvents] = useState([]);

    function Friend(friend) {
        const data = friend.data();
        console.log("HELLO!")
        console.log(data);
        console.log(friendsCtx);
        return (
            <Menu key={friend.id} style={styles.event}>
                <MenuTrigger>
                    <Text style={styles.eventTitle}>{data.friend}</Text>
                </MenuTrigger>
                <MenuOptions>
                    <MenuOption text="Delete event" />
                </MenuOptions>
            </Menu>
        );
    }

    async function addFriend() {
        const friend = newFriend.trim().toLowerCase();
        const docRef = await addDoc(collection(db, authCtx.email), { friend });
        friendsCtx.addFriend(await getDoc(docRef));
        setNewFriend("");
        Alert.alert("New friend added!");
    }

    // async function DeleteEvent(event) {
    //     await deleteDoc(doc(db, "events", event.id));
    //     eventsCtx.deleteEvent(event);
    // }

    useEffect(() => {
        async function getUserFriends() {
            const q = query(collection(db, authCtx.email));
            const querySnapshot = await getDocs(q);
            console.log(querySnapshot.docs);
            // setUserEvents(querySnapshot.docs);
            friendsCtx.setFriends(querySnapshot.docs);
            console.log("Friends: ", friendsCtx.friends);
        }
        getUserFriends();
    }, []);

    const [newFriend, setNewFriend] = useState("");
    

    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>My Friends</Text>
            <View>
                <Input placeholder="Enter email here" onChangeText={setNewFriend} />
                <Button style={styles.createEvent} title="Add new friend" onPress={addFriend} />
            </View>
            <View style={styles.eventsContainer}>
                <FlatList data={friendsCtx.friends} renderItem={itemData => Friend(itemData.item)} />
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
    marginBottom: 10
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