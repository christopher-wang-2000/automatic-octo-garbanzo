import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, DocumentData } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';
import { FriendsContext } from '../store/friends-context';
import { Friend, loadFriends } from './Friends';
import LoadingOverlay from './LoadingOverlay';

export default function EventsScreen({ navigation, ...props }) {
    const authCtx = useContext(AuthContext);
    const eventsCtx = useContext(EventsContext);
    const friendsCtx = useContext(FriendsContext);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const myUid: string = authCtx.uid;
    const friendUidMap: Map<String, String> = new Map();
    for (const friend of friendsCtx.friends) {
      friendUidMap.set(friend.uid, friend.email);
    }

    function renderEvent(event: DocumentData) {
        const data = event.data();
        const isMyEvent = (data.uid === myUid)
        const creator = isMyEvent ? "me" : friendUidMap.get(data.uid);
        return (
            <Menu key={event.id} style={isMyEvent ? styles.myEvent : styles.otherEvent}>
                <MenuTrigger>
                    <Text style={styles.eventTitle}>{data.title}</Text>
                    <Text style={styles.eventStartTime}>{data.startTime.toDate().toString()}</Text>
                    <Text style={styles.eventCreatedBy}>Created by {creator}</Text>
                    <Text style={styles.eventDescription}>{data.description}</Text>
                </MenuTrigger>
                <MenuOptions>
                    {isMyEvent && <MenuOption onSelect={() => {navigation.navigate("Update Event", { eventId: event.id, eventData: event.data() })}} text="Update event" />}
                    {isMyEvent && <MenuOption onSelect={() => deleteEvent(event)} text="Delete event" />}
                </MenuOptions>
            </Menu>
        );
    }

    async function deleteEvent(event: DocumentData) {
        await deleteDoc(doc(db, "events", event.id));
        eventsCtx.deleteEvent(event);
    }

    async function getEvents() {
      setRefreshing(true);
      const friends = await loadFriends(myUid);
      friendsCtx.setFriends(friends);
      const friendUids: Array<string> = friends.map((friend: Friend) => friend.uid);
      const allUids: Array<string> = [myUid, ...friendUids];
      const uidsToUse: Array<string> = (props?.route?.params?.uids) ? allUids.filter((uid) => props.route.params.uids.includes(uid)) : allUids;

      const q = query(collection(db, "events"), where("uid", "in", uidsToUse), orderBy("startTime"));
      const querySnapshot = await getDocs(q);
      eventsCtx.setEvents(querySnapshot.docs);
      setRefreshing(false);
    }
    useEffect(() => {
      async function loadEvents() {
        setLoading(true);
        await getEvents();
        setLoading(false);
      }
      loadEvents();
    }, []);

    if (loading) {
      return <LoadingOverlay message="Loading events..." />
    }

    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>My Events</Text>
            <Button style={styles.createEvent} title="Create new event" onPress={() => navigation.navigate("Create Event")} />
            <View style={styles.eventsContainer}>
                <FlatList data={eventsCtx.events} renderItem={itemData => renderEvent(itemData.item)}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { getEvents(); }} />
                  } />
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
    marginBottom: 10
  },
  eventsContainer: {
    flex: 14,
    padding: 10,
    borderColor: "grey",
    borderWidth: 1
  },
  myEvent: {
    marginVertical: 5,
    padding: 10,
    backgroundColor: "lightgreen",
    borderRadius: 15
  },
  otherEvent: {
    marginVertical: 5,
    padding: 10,
    backgroundColor: "lightblue",
    borderRadius: 15
  },
  eventTitle: {
    fontWeight: "bold",
  },
  eventStartTime: {
    fontStyle: "italic",
  },
  eventCreatedBy: {
    fontStyle: "italic",
    marginBottom: 5
  },
  eventDescription: {

  }
});