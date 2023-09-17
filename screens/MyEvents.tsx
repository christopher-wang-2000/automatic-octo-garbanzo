import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';
import { collection, query, where, getDocs } from "firebase/firestore";

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';

function MyEventsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const eventsCtx = useContext(EventsContext);
    // const [userEvents, setUserEvents] = useState([]);

    useEffect(() => {
        async function getUserEvents() {
            const q = query(collection(db, "events"), where("uid", "==", authCtx.uid));
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
            <View style={styles.eventsContainer}>
                {eventsCtx.events.map((event) => {
                return <Text key={event.id}>{event.data().title}</Text>})}
                <Button title="Create new event" onPress={() => navigation.navigate("Create Event")} />
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
  eventsContainer: {
    flex: 9,
  }
});