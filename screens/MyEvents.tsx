import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';

function Event(event) {
    const data = event.data();
    console.log(data);
    console.log(data.startTime.toDate());
    return (
        <View key={event.id} style={styles.event}>
            <Text style={styles.eventTitle}>{data.title}</Text>
            <Text style={styles.eventStartTime}>{data.startTime.toDate().toString()}</Text>
            <Text style={styles.eventDescription}>{data.description}</Text>
        </View>
    );
}

function MyEventsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const eventsCtx = useContext(EventsContext);
    // const [userEvents, setUserEvents] = useState([]);

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
                <ScrollView>{eventsCtx.events.map((event) => Event(event))}</ScrollView>
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