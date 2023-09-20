import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, TextInput } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { collection, query, where, getDocs, addDoc, getDoc } from "firebase/firestore";
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { DateTime } from "luxon";

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';
import LoadingOverlay from './LoadingOverlay';
import { createEventFromDoc } from './Events';

function CreateEventScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const eventsCtx = useContext(EventsContext);
    const [eventTitle, setEventTitle] = useState("");
    const [startTime, setStartTime] = useState(DateTime.now().toJSDate());
    const [endTime, setEndTime] = useState(DateTime.now().plus({hours: 2}).toJSDate());
    const [description, setDescription] = useState("");
    const [creatingEvent, setCreatingEvent] = useState(false);

    async function addEvent() {
        if (eventTitle === "") {
            Alert.alert("Your event needs a title!");
        }
        else if (endTime <= startTime) {
            Alert.alert("End time must be later than start time.");
        }
        else {
            setCreatingEvent(true);
            const docRef = await addDoc(collection(db, "events"), { title: eventTitle, startTime, endTime, description, uid: authCtx.uid });
            eventsCtx.addEvent(createEventFromDoc(await getDoc(docRef)));
            setCreatingEvent(false);
            Alert.alert("Event created!");
            navigation.navigate("My Events");
        }
    }

    if (creatingEvent) {
        return <LoadingOverlay message="Creating event..."/>
    }

    return (
        <View style={styles.rootContainer}>
            <Input placeholder="Event title" onChangeText={setEventTitle} />
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>Start time:</Text>
                <RNDateTimePicker value={startTime} mode="datetime" onChange={(_, date) => setStartTime(date)} />
            </View>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>End time:</Text>
                <RNDateTimePicker value={endTime} mode="datetime" onChange={(_, date) => setEndTime(date)} />
            </View>
            <TextInput style={styles.eventDescription} placeholder="Enter a description here..."
                multiline={true} numberOfLines={5} onChangeText={setDescription} />
            <Button title="Create event" onPress={addEvent} />
        </View>
    );
}

export default CreateEventScreen;

const styles = StyleSheet.create({
    rootContainer: {
        flex: 0.5,
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
    }
});