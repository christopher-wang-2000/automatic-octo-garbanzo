import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, updateDoc, Query, DocumentData, arrayUnion, arrayRemove } from "firebase/firestore";
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
  rsvps: Array<string>
}

export function createEventFromDoc(document: DocumentData) {
  const data = document.data();
  return {  docId: document.id,
            title: data.title,
            startTime: data.startTime.toDate(),
            endTime: data.endTime.toDate(),
            description: data.description,
            creatorUid: data.uid,
            rsvps: data.rsvps
          };
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
    const creator = isMyEvent ? "you" : friendUidMap.get(event.creatorUid);
    const oneDay = (event.startTime.toLocaleDateString() === event.endTime.toLocaleDateString())
    const currentTime = new Date().getTime();
    const inProgress = (currentTime >= event.startTime.getTime()) && (currentTime < event.endTime.getTime());
    const ended = (currentTime >= event.endTime.getTime());
    const rsvpd = (event.rsvps.includes(myUid));

    return (
      <Menu key={event.docId} style={rsvpd ? styles.rsvpdEvent : styles.otherEvent}>
        <MenuTrigger>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {inProgress && <Text style={styles.eventStatus}>(IN PROGRESS)</Text>}
          {ended && <Text style={styles.eventStatus}>(ENDED)</Text>}

          {oneDay && <Text style={styles.eventTime}>{event.startTime.toLocaleDateString() + ", " +
            event.startTime.toLocaleTimeString(undefined, { timeStyle: "short" })
            + " to " + event.endTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}
          {!oneDay && <Text style={styles.eventTime}>Starts: {event.startTime.toLocaleDateString() + " "
            + event.startTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}
          {!oneDay && <Text style={styles.eventTime}>Ends: {event.endTime.toLocaleDateString() + " "
            + event.endTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}

          <Text style={styles.eventCreatedBy}>Created by {creator}</Text>
          {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}

          {!rsvpd && event.rsvps.length === 1 && <Text style={styles.eventRsvp}>1 person is coming</Text>}
          {!rsvpd && event.rsvps.length > 1 && <Text style={styles.eventRsvp}>{event.rsvps.length} people are coming</Text>}
          {rsvpd &&event.rsvps.length === 2 && <Text style={styles.eventRsvp}>You and {event.rsvps.length-1} other are coming</Text>}
          {rsvpd &&event.rsvps.length !== 2 && <Text style={styles.eventRsvp}>You and {event.rsvps.length-1} others are coming</Text>}
        </MenuTrigger>
        <MenuOptions>
          {isMyEvent && <MenuOption text="Update event" onSelect={() => { navigation.navigate("Create Event", { event }) }} />}
          {isMyEvent && <MenuOption text="Delete event" onSelect={() => deleteEvent(event)} />}
          {!rsvpd && !ended && <MenuOption text="RSVP" onSelect={() => rsvp(event)}/>}
          {rsvpd && !ended && <MenuOption text="Cancel RSVP" onSelect={() => unrsvp(event)}/>}
        </MenuOptions>
      </Menu>
    );
  }

  async function rsvp(event: Event) {
    await updateDoc(doc(db, "events", event.docId), { rsvps: arrayUnion(myUid) });
    event.rsvps.push(myUid);
    eventsCtx.updateEvent(event);
  }
  async function unrsvp(event: Event) {
    await updateDoc(doc(db, "events", event.docId), { rsvps: arrayRemove(myUid) });
    event.rsvps = event.rsvps.filter((uid) => uid !== myUid);
    eventsCtx.updateEvent(event);
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

    let q: Query<DocumentData, DocumentData>;
    if (props?.route?.params?.rsvpdOnly) {
      q = query(collection(db, "events"), where("rsvps", "array-contains", myUid));
    }
    else {
      q = query(collection(db, "events"), where("uid", "in", uidsToUse));
    }
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
      <Text style={styles.title}>{props?.route?.params?.title}</Text>
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
    padding: 5,
    borderColor: "grey",
    borderWidth: 1,
    width: "100%",
  },
  noEventText: {
    color: "grey",
    textAlign: "center",
    fontStyle: "italic"
  },
  rsvpdEvent: {
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
  eventStatus: {
    fontWeight: "bold"
  },
  eventTime: {
    fontStyle: "italic",
  },
  eventCreatedBy: {
    fontStyle: "italic",
    
  },
  eventDescription: {
    marginTop: 5
  },
  eventRsvp: {
    fontStyle: "italic",
    marginTop: 5
  },
});