import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, FlatList, RefreshControl, Pressable } from 'react-native';
import { Button } from 'react-native-elements';
import Modal from "react-native-modal";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { getCalendars } from 'expo-localization';

import { collection, query, where, getDocs, orderBy, doc, deleteDoc, updateDoc, Query, DocumentData, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import { db } from '../firebase';

import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';
import { UsersContext } from '../store/users-context';

import { User } from '../utils/user';
import { Friend } from '../utils/friend';
import { Group } from '../utils/group';
import LoadingOverlay from './LoadingOverlay';

import { Logs } from 'expo'

Logs.enableExpoCliLogging()

export type Event = {
  docId: string,
  title: string,
  startTime: Date,
  endTime: Date,
  description: string,
  creatorUid: string,
  friendsCanSee: boolean,
  invitedGroups: Array<Group>
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
            friendsCanSee: data.friendsCanSee,
            invitedGroups: data.invitedGroups,
            rsvps: data.rsvps
          };
}

export default function EventsScreen({ navigation, ...props }) {
  const authCtx = useContext(AuthContext);
  const eventsCtx = useContext(EventsContext);
  const usersCtx = useContext(UsersContext);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState(undefined);
  const [selectingFilter, setSelectingFilter] = useState(false);

  const timezone: string | null = getCalendars()[0].timeZone;
  const past = (props?.route?.params?.past === true);
  const rsvpdOnly = (props?.route?.params?.rsvpdOnly === true);

  const myUid: string = authCtx.uid;

  function renderEvent(event: Event) {
    const isMyEvent = (event.creatorUid === myUid);
    const creator = isMyEvent ? "you" : usersCtx.getUser(event.creatorUid).fullName;
    const oneDay = (event.startTime.toLocaleDateString() === event.endTime.toLocaleDateString());
    const currentTime = new Date().getTime();
    const inProgress = (currentTime >= event.startTime.getTime()) && (currentTime < event.endTime.getTime());
    const ended = (currentTime >= event.endTime.getTime());
    const rsvpd = (event.rsvps.includes(myUid));

    return (
      <Menu key={event.docId} style={rsvpd ? styles.rsvpdEvent : styles.otherEvent}>
        <MenuTrigger>
          <Text style={styles.eventTitle}>{event.title + (inProgress ? " (IN PROGRESS)" : "")}</Text>

          {oneDay && <Text style={styles.eventTime}>{event.startTime.toLocaleDateString() + ", " +
            event.startTime.toLocaleTimeString(undefined, { timeStyle: "short" })
            + " to " + event.endTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}
          {!oneDay && <Text style={styles.eventTime}>Starts: {event.startTime.toLocaleDateString() + " "
            + event.startTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}
          {!oneDay && <Text style={styles.eventTime}>Ends: {event.endTime.toLocaleDateString() + " "
            + event.endTime.toLocaleTimeString(undefined, { timeStyle: "short" })}</Text>}

          <Text style={styles.eventCreatedBy}>Created by {creator}</Text>
          {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}

          <Pressable onPress={() => { activateRsvpOverlay(event); }}>
            {!rsvpd && event.rsvps.length === 1 && <Text style={styles.eventRsvp}>1 person is coming</Text>}
            {!rsvpd && event.rsvps.length > 1 && <Text style={styles.eventRsvp}>{event.rsvps.length} people are coming</Text>}
            {rsvpd &&event.rsvps.length === 2 && <Text style={styles.eventRsvp}>You and {event.rsvps.length-1} other are coming</Text>}
            {rsvpd &&event.rsvps.length > 2 && <Text style={styles.eventRsvp}>You and {event.rsvps.length-1} others are coming</Text>}
          </Pressable>
        </MenuTrigger>
        <MenuOptions>
          {isMyEvent && !past && <MenuOption text="Update event" onSelect={() => { navigation.navigate("Create Event", { event }) }} />}
          {isMyEvent && !past && <MenuOption text="Delete event" onSelect={() => deleteEvent(event)} />}
          {!rsvpd && !ended && <MenuOption text="I'm coming!" onSelect={() => rsvp(event)}/>}
          {rsvpd && !ended && <MenuOption text="I'm no longer coming" onSelect={() => unrsvp(event)}/>}
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
    const friends = await usersCtx.loadFriends(myUid);
    const groups = await usersCtx.loadGroups(myUid);

    const friendUids: Array<string> = friends.map((friend: Friend) => friend.uid);
    const allUids: Array<string> = [myUid, ...friendUids];
    const uidsToUse: Array<string> = (props?.route?.params?.uids) ? allUids.filter((uid) => props.route.params.uids.includes(uid)) : allUids;

    let events: Array<Event>;
    const timeframe = where("endTime", past ? "<=" : ">", Timestamp.fromDate(new Date()));
    if (rsvpdOnly) {
      const q = query(collection(db, "events"), where("rsvps", "array-contains", myUid), timeframe);
      const querySnapshot = await getDocs(q);
      events = querySnapshot.docs.map(createEventFromDoc);
    }
    else {
      const myEventsQuery = query(collection(db, "events"), where("uid", "==", myUid), timeframe);
      let snapshotPromises = [getDocs(myEventsQuery)];
      if (friends.length > 0) {
        const friendQuery = query(collection(db, "events"), where("friendsCanSee", "==", true), where("uid", "in", friends.map((f: Friend) => f.uid)), timeframe);
        snapshotPromises.push(getDocs(friendQuery));
      }
      if (groups.length > 0) {
        const groupQuery = query(collection(db, "events"), where("invitedGroups", "array-contains-any", groups.map((g: Group) => g.docId)), timeframe);
        snapshotPromises.push(getDocs(groupQuery));
      }
      const snapshots = await Promise.all(snapshotPromises);
      events = snapshots.flatMap((s) => s.docs).map(createEventFromDoc);
      events = [...new Map(events.map((e) => [e.docId, e])).values()] // remove duplicates
    }
    eventsCtx.setEvents(events);
    await Promise.all(events.map((e: Event) => usersCtx.loadUser(e.creatorUid)));
    setRefreshing(false);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await getEvents();
      setLoading(false);
    }
    load();
  }, []);

  async function activateRsvpOverlay(event: Event) {
    await Promise.all(event.rsvps.map(usersCtx.loadUser));
    setRsvpEvent(event);
  }

  function rsvpOverlay() {
    return (
      <Modal
      backdropOpacity={0.5}
      isVisible={(rsvpEvent !== undefined)}
      style={{margin: 0}}
      swipeDirection={"down"}
      onBackdropPress={() => setRsvpEvent(undefined)}
      onSwipeComplete={() => setRsvpEvent(undefined)}
      >
      <View style={{height: "30%", marginTop: "auto", backgroundColor: "white", borderTopWidth: 1, borderTopColor: "gray"}}>
        <View style={{padding: 8}}>
          <Text style={{fontSize: 18, fontWeight: "bold", marginTop: 5, marginBottom: 5}}>Coming to {rsvpEvent?.title}:</Text>
          <FlatList data={rsvpEvent?.rsvps} renderItem={rsvpUid => (
            <Text style={{fontSize: 16, marginBottom: 2}}>{usersCtx.getUser(rsvpUid.item).fullName}</Text>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { getEvents(); }} />
          } />
        </View>
      </View>
    </Modal>
    )
  }

  function filterOverlay() {
    return (
      <Modal
      backdropOpacity={0.5}
      isVisible={selectingFilter}
      style={{margin: 0}}
      swipeDirection={"down"}
      onBackdropPress={() => setSelectingFilter(false)}
      onSwipeComplete={() => setSelectingFilter(false)}
      >
      <View style={{height: "50%", marginTop: "auto", backgroundColor: "white", borderTopWidth: 1, borderTopColor: "gray"}}>
        <View style={{padding: 8}}>

          <View style={{flexDirection: "row", justifyContent: "center", gap: 10}}>
            <View style={{flex: 1}}>
              <Button title={"Cancel"} onPress={() => setSelectingFilter(false)} />
            </View>
            <View style={{flex: 1}}>
              <Button title={"Filter"}  />
            </View>
          </View>
          
        </View>
      </View>
    </Modal>
    )
  }

  if (loading) {
    return <LoadingOverlay message="Loading events..." />
  }

  return (
    <View style={styles.rootContainer}>
      <Text style={styles.title}>{props?.route?.params?.title}</Text>
      <View style={{flexDirection: "row", gap: 15}}>
        {!past && <Button style={styles.createEvent} title="Create event" onPress={() => navigation.navigate("Create Event")} />}
        <Button style={{}} title="Filter events" onPress={() => setSelectingFilter(true)}/>
      </View>
      
      <Text style={{paddingBottom: 5}}>Timezone: {timezone}</Text>
      <View style={styles.eventsContainer}>
        {(eventsCtx.events.length === 0) && <Text style={styles.noEventText}>There are currently no upcoming events. Create one to get started!</Text>}
          <FlatList style={{paddingVertical: 5}} contentContainerStyle={{paddingBottom: 10}} data={eventsCtx.events} renderItem={itemData => renderEvent(itemData.item)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { getEvents(); }} />
            } />
      </View>
      {rsvpOverlay()}
      {filterOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20
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
    paddingHorizontal: 28,
    borderColor: "grey",
    borderTopWidth: 3,
    borderBottomWidth: 0,
    width: "100%",
  },
  noEventText: {
    color: "grey",
    textAlign: "center",
    fontStyle: "italic"
  },
  rsvpdEvent: {
    marginVertical: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "lightgreen",
    borderRadius: 15
  },
  otherEvent: {
    marginVertical: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    marginTop: 5,
    fontWeight: "bold",
    color: "#001066",
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: "hidden",
    alignSelf: "flex-start"
  },
});