import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';

function MyEventsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const eventsCtx = useContext(EventsContext);
    // const [userEvents, setUserEvents] = useState([]);

    function Event(event) {
        const data = event.data();
        console.log(data);
        console.log(data.startTime.toDate());
        console.log(eventsCtx);
        return (
            <Menu key={event.id} style={styles.event}>
                <MenuTrigger>
                    <Text style={styles.eventTitle}>{data.title}</Text>
                    <Text style={styles.eventStartTime}>{data.startTime.toDate().toString()}</Text>
                    <Text style={styles.eventDescription}>{data.description}</Text>
                </MenuTrigger>
                <MenuOptions>
                    <MenuOption onSelect={() => {console.log(event); navigation.navigate("Update Event", { eventId: event.id, eventData: event.data() })}} text="Update event" />
                    <MenuOption onSelect={() => DeleteEvent(event)} text="Delete event" />
                </MenuOptions>
            </Menu>
        );
    }

    async function DeleteEvent(event) {
        await deleteDoc(doc(db, "events", event.id));
        eventsCtx.deleteEvent(event);
    }

    useEffect(() => {
        async function getUserEvents() {
            const q = query(collection(db, "events"), where("uid", "==", authCtx.uid), orderBy("startTime"));
            const querySnapshot = await getDocs(q);
            console.log(querySnapshot.docs);
            for (const doc of querySnapshot.docs) {
                console.log(doc.data());
            }
            // setUserEvents(querySnapshot.docs);
            eventsCtx.setEvents(querySnapshot.docs);
        }
        getUserEvents();
    }, []);

    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>My Events</Text>
            <Button style={styles.createEvent} title="Create new event" onPress={() => navigation.navigate("Create Event")} />
            <View style={styles.eventsContainer}>
                <FlatList data={eventsCtx.events} renderItem={itemData => Event(itemData.item)} />
            </View>
        </View>
    );
}

export default MyEventsScreen;

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