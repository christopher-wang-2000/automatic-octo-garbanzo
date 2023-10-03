import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView, FlatList, RefreshControl, Pressable, Switch } from 'react-native';
import { Button } from 'react-native-elements';
import Modal from "react-native-modal";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { Checkbox } from 'expo-checkbox';
import { getCalendars } from 'expo-localization';
import RNCalendarEvents from "react-native-calendar-events";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { googleApiKey } from '../api_key';

import { collection, query, where, getDocs, orderBy, doc, deleteDoc, updateDoc, Query, DocumentData, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import { db, auth } from '../firebase';

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
  invitedGroups: Array<string>
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
  const eventsCtx = useContext(EventsContext);
  const usersCtx = useContext(UsersContext);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState(undefined);
  const [selectingFilter, setSelectingFilter] = useState(false);

  const [hideRsvpdFilter, setHideRsvpdFilter] = useState(false);
  const [showOnlyRsvpdEvents, setShowOnlyRsvpdEvents] = useState(false);
  const [showOnlyFriendEvents, setShowOnlyFriendEvents] = useState(false);
  const [filteredGroups, setFilteredGroups] = useState(new Array<string>);

  const timezone: string | null = getCalendars()[0].timeZone;
  const past = (props?.route?.params?.past === true);
  const rsvpdOnly = (props?.route?.params?.rsvpdOnly === true);

  const myUid: string = auth.currentUser.uid;

  function renderEvent(event: Event) {
    const isMyEvent = (event.creatorUid === myUid);
    const creator = isMyEvent ? "you" : usersCtx.getUser(event.creatorUid).fullName;
    const oneDay = (event.startTime.toLocaleDateString() === event.endTime.toLocaleDateString());
    const currentTime = new Date().getTime();
    const inProgress = (currentTime >= event.startTime.getTime()) && (currentTime < event.endTime.getTime());
    const ended = (currentTime >= event.endTime.getTime());
    const rsvpd = (event.rsvps.includes(myUid));
    const showRsvpText = (event.rsvps.length - (rsvpd ? 1 : 0)) > 0;

    async function addToGoogleCalendar(event: Event) {
      try {
        if (!(await GoogleSignin.isSignedIn())) {
          await GoogleSignin.signIn();
        }
        const accessToken = (await GoogleSignin.getTokens()).accessToken;
        const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-goog-api-header': googleApiKey
            },
            body: JSON.stringify({
                'start': { 'dateTime': event.startTime.toISOString() },
                'end': { 'dateTime': event.endTime.toISOString() },
                'summary': event.title,
                'description': event.description,
                // 'id': event.docId,
            })
        });
        if (response["ok"]) {
          Alert.alert("Event successfully exported!");
        }
        else {
          Alert.alert("Export to Google Calendar failed. Contact the creator for support.");
        }
      }
      catch (err) {
          console.error(err);
          Alert.alert("Export to Google Calendar failed. Contact the creator for support.");
      }
    }

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

          {<View style={styles.rsvpContainer}>
            <Pressable onPress={() => { activateRsvpOverlay(event); }}>
              {!showRsvpText && <Text style={styles.rsvpText}>See who's invited</Text>}
              {!rsvpd && event.rsvps.length === 1 && <Text style={styles.rsvpText}>1 person is coming</Text>}
              {!rsvpd && event.rsvps.length > 1 && <Text style={styles.rsvpText}>{event.rsvps.length} people are coming</Text>}
              {rsvpd &&event.rsvps.length === 2 && <Text style={styles.rsvpText}>You and {event.rsvps.length-1} other are coming</Text>}
              {rsvpd &&event.rsvps.length > 2 && <Text style={styles.rsvpText}>You and {event.rsvps.length-1} others are coming</Text>}
            </Pressable>
          </View>}
        </MenuTrigger>
        <MenuOptions>
          {isMyEvent && <MenuOption text="Update event" onSelect={() => { navigation.navigate("Create Event", { event }) }} />}
          {isMyEvent && <MenuOption text="Delete event" onSelect={() => deleteEvent(event)} />}
          {!rsvpd && !ended && <MenuOption text="I'm coming!" onSelect={() => rsvp(event)}/>}
          {rsvpd && !ended && <MenuOption text="I'm no longer coming" onSelect={() => unrsvp(event)}/>}
          <MenuOption text="Add to Google Calendar" onSelect={() => addToGoogleCalendar(event)} />
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
      <View style={{height: "50%", marginTop: "auto", backgroundColor: "white", borderTopWidth: 1, borderTopColor: "gray", borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden"}}>
        <View style={{paddingTop: 12, paddingHorizontal: 18}}>
          <Text style={{fontSize: 18, fontWeight: "bold", marginTop: 5, marginBottom: 5}}>{rsvpEvent?.title}:</Text>
          <ScrollView>
            <Text style={{fontSize: 16, fontWeight: "bold", marginTop: 10, marginBottom: 5}}>Invited groups you're in:</Text>
            {rsvpEvent?.friendsCanSee && <Text style={{fontSize: 16, marginBottom: 2, marginLeft: 5}}>{usersCtx.getUser(rsvpEvent?.creatorUid).firstName}'s friends</Text>}
            {usersCtx.groups.filter((group: Group) => (group.members.includes(myUid) && rsvpEvent?.invitedGroups?.includes(group.docId)))
              .map((group: Group) => (
                <Text key={group.docId} style={{fontSize: 16, marginBottom: 2, marginLeft: 5}}>{group.title}</Text>
            ))}
            <Text style={{fontSize: 16, fontWeight: "bold", marginTop: 10, marginBottom: 5}}>People who are coming:</Text>
            {rsvpEvent?.rsvps.map((rsvpUid: string) => (
              <Text key={rsvpUid} style={{fontSize: 16, marginBottom: 2, marginLeft: 5}}>{usersCtx.getUser(rsvpUid).fullName}</Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
    )
  }

  function renderGroupSelect(group: Group) {
    function onPress(checked: boolean) {
        if (checked) {
            setFilteredGroups([...filteredGroups, group.docId]);
        } else {
            setFilteredGroups(filteredGroups.filter((groupId: string) => (groupId !== group.docId)));
        }
    }
    const checked: boolean = filteredGroups.includes(group.docId);
    return (
        <View style={{flexDirection: "row", borderColor: "#D4D4D4", borderWidth: 1, backgroundColor: "white", borderRadius: 10, padding: 12, margin: 5, alignItems: "center" }}>
            <Text style={{flex: 1, marginLeft: 15, fontSize: 16}}>{group.title}</Text>
            <Checkbox style={{borderRadius: 5}} value={checked}
                onValueChange={onPress} />
        </View>
    )
  }

  function filterOverlay() {
    function filterOptionSwitch(state: boolean, setState, label: string) {
      return (
        <View style={{paddingLeft: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center"}}>
          <Text style={{flex: 1, fontSize: 16}}>{label}</Text>
          <Switch value={state} onValueChange={setState} />
        </View>
      );
    }
    return (
      <Modal
      backdropOpacity={0.5}
      isVisible={selectingFilter}
      style={{margin: 0}}
      swipeDirection={"down"}
      onBackdropPress={() => setSelectingFilter(false)}
      onSwipeComplete={() => setSelectingFilter(false)}
      >
      <View style={{height: "60%", marginTop: "auto", backgroundColor: "white", borderTopWidth: 1, borderTopColor: "gray", borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden"}}>
        <View style={{paddingHorizontal: 15, paddingVertical: 10}}>
          <Text style={{fontWeight: "bold", fontSize: 18, marginTop: 8, marginBottom: 8}}>Filter options:</Text>
          {filterOptionSwitch(hideRsvpdFilter, (state) => {
            if (state) {
              setHideRsvpdFilter(true);
              setShowOnlyRsvpdEvents(false);
            } else {
              setHideRsvpdFilter(false);
            }
          }, "Hide events you're going to")}
          {filterOptionSwitch(showOnlyRsvpdEvents, (state) => {
            if (state) {
              setShowOnlyRsvpdEvents(true);
              setHideRsvpdFilter(false);
            } else {
              setShowOnlyRsvpdEvents(false);
            }
          }, "Only show events you're going to")}
          {filterOptionSwitch(showOnlyFriendEvents, setShowOnlyFriendEvents, "Only show events made by friends")}
          <View style={{paddingLeft: 10, paddingTop: 14}}>
            <Text style={{fontSize: 16, marginBottom: 10}}>Only show events for these groups:</Text>
            <FlatList style={{backgroundColor: "#d6d6d6", borderRadius: 5, borderWidth: 1, borderColor: "#cccccc", padding: 5}} data={usersCtx.groups}
                    renderItem={itemData => renderGroupSelect(itemData.item)} />
          </View>
        </View>
      </View>
    </Modal>
    )
  }

  if (loading) {
    return <LoadingOverlay message="Loading events..." />
  }

  function eventsList() {
    let eventsToShow = eventsCtx.events;
    if (hideRsvpdFilter) {
      eventsToShow = eventsToShow.filter((e) => !e.rsvps.includes(myUid));
    }
    if (showOnlyRsvpdEvents) {
      eventsToShow = eventsToShow.filter((e) => (e.rsvps.includes(myUid)));
    }
    if (showOnlyFriendEvents) {
      const friendUids = usersCtx.friends.map((f) => f.uid);
      eventsToShow = eventsToShow.filter((e) => friendUids.includes(e.creatorUid));
    }
    if (filteredGroups.length > 0) {
      eventsToShow = eventsToShow.filter((e) => e.invitedGroups?.some((g) => filteredGroups.includes(g)));
    }
    return (
      <View style={styles.eventsContainer}>
        {(eventsToShow.length === 0) && <Text style={styles.noEventText}>{past ? "No previous events." : "No upcoming events."}</Text>}
          <FlatList style={{paddingVertical: 5}} contentContainerStyle={{paddingBottom: 10}} data={eventsToShow} renderItem={itemData => renderEvent(itemData.item)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { getEvents(); }} />
            } />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <Text style={styles.title}>{props?.route?.params?.title}</Text>
      <View style={{flexDirection: "row", gap: 15}}>
        {!past && <Button style={styles.createEvent} title="Create event" onPress={() => navigation.navigate("Create Event")} />}
        <Button style={{}} title="Filter events" onPress={() => setSelectingFilter(true)}/>
      </View>
      <Text style={{paddingBottom: 5}}>Timezone: {timezone}</Text>
      {eventsList()}
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
    borderColor: "grey",
    borderTopWidth: 3,
    borderBottomWidth: 0,
    width: "100%",
  },
  noEventText: {
    color: "grey",
    textAlign: "center",
    fontStyle: "italic",
    fontSize: 16,
    marginTop: 20
  },
  rsvpdEvent: {
    marginVertical: 5,
    paddingHorizontal: 12,
    marginHorizontal: 28,
    paddingVertical: 8,
    backgroundColor: "lightgreen",
    borderRadius: 15
  },
  otherEvent: {
    marginVertical: 5,
    paddingHorizontal: 12,
    marginHorizontal: 28,
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
  rsvpContainer: {
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
  rsvpText: {
    fontStyle: "italic",
    fontWeight: "bold",
    color: "#001066",
  },
});