import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, DocumentData } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { getCalendars } from 'expo-localization';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';
import { FriendsContext } from '../store/friends-context';
import { Friend, loadFriends } from './Friends';
import LoadingOverlay from './LoadingOverlay';

export type Event = {
  docId: string,
  title: string,
  startTime: Date,
  endTime: Date,
  description: string,
  creatorUid: string,
  comingUids: Array<string>
}

export function createEventFromDoc(document: DocumentData) {
  const data = document.data();
  return { docId: document.id, title: data.title, startTime: data.startTime.toDate(), endTime: data.endTime?.toDate(), description: data.description, creatorUid: data.uid, comingUids: [] };
}

export default function EventsScreen({ navigation, ...props }) {
  const authCtx = useContext(AuthContext);
  const eventsCtx = useContext(EventsContext);
  const friendsCtx = useContext(FriendsContext);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const timezone: string | null = getCalendars()[0].timeZone;

  const myUid: string = authCtx.uid;
  const friendUidMap: Map<String, String> = new Map();
  for (const friend of friendsCtx.friends) {
    friendUidMap.set(friend.uid, friend.email);
  }

  function renderEvent(event: Event) {
    const isMyEvent = (event.creatorUid === myUid)
    const creator = isMyEvent ? "me" : friendUidMap.get(event.creatorUid);
    const oneDay = (event.startTime.toLocaleDateString() === event.endTime.toLocaleDateString())

    return (
      <Menu key={event.docId} style={isMyEvent ? styles.myEvent : styles.otherEvent}>
        <MenuTrigger>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {oneDay && <Text style={styles.eventTime}>{event.startTime.toLocaleDateString() + ", " +
            event.startTime.toLocaleTimeString(undefined, { timeStyle: "short" })
            + " to " + event.endTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}
          {!oneDay && <Text style={styles.eventTime}>Starts: {event.startTime.toLocaleDateString() + " "
            + event.startTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}
          {!oneDay && <Text style={styles.eventTime}>Ends: {event.endTime.toLocaleDateString() + " "
            + event.endTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}
          <Text style={styles.eventCreatedBy}>Created by {creator}</Text>
          {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
        </MenuTrigger>
        <MenuOptions>
          {isMyEvent && <MenuOption onSelect={() => { navigation.navigate("Update Event", { event }) }} text="Update event" />}
          {isMyEvent && <MenuOption onSelect={() => deleteEvent(event)} text="Delete event" />}
        </MenuOptions>
      </Menu>
    );
  }

  async function deleteEvent(event: Event) {
    await deleteDoc(doc(db, "events", event.docId));
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
    const events: Array<Event> = querySnapshot.docs.map(createEventFromDoc);
    eventsCtx.setEvents(events);
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

  console.log(eventsCtx.events);

  return (
    <View style={styles.rootContainer}>
      <Text style={styles.title}>My Events</Text>
      <Button style={styles.createEvent} title="Create new event" onPress={() => navigation.navigate("Create Event")} />
      <Text>Timezone: {timezone}</Text>
      <Text>Scroll up to refresh</Text>
      <View style={styles.eventsContainer}>
        {(eventsCtx.events.length === 0) && <Text style={styles.noEventText}>There are currently no upcoming events. Create one to get started!</Text>}
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
    borderWidth: 1,
    width: "90%",
  },
  noEventText: {
    color: "grey",
    textAlign: "center",
    fontStyle: "italic"
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
  eventTime: {
    fontStyle: "italic",
  },
  eventCreatedBy: {
    fontStyle: "italic",
  },
  eventDescription: {
    marginTop: 5
  }
});