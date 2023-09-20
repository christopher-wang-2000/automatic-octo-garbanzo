import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, TextInput } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { collection, query, where, doc, getDocs, addDoc, getDoc, updateDoc } from "firebase/firestore";
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { DateTime } from "luxon";
import { Event } from './Events';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';
import LoadingOverlay from './LoadingOverlay';
import { createEventFromDoc } from './Events';

function CreateEventScreen({ navigation, ...props }) {
    const authCtx = useContext(AuthContext);
    const eventsCtx = useContext(EventsContext);
    const event = props?.route?.params?.event;

    const [title, setTitle] = useState(event ? event.title : "");
    const [startTime, setStartTime] = useState(event ? event.startTime : DateTime.now().toJSDate());
    const [endTime, setEndTime] = useState(event ? event.endTime : DateTime.now().plus({hours: 2}).toJSDate());
    const [description, setDescription] = useState(event ? event.description : "");
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [updatingEvent, setUpdatingEvent] = useState(false);

    async function addEvent() {
        if (title === "") {
            Alert.alert("Your event needs a title!");
        }
        else if (endTime <= startTime) {
            Alert.alert("End time must be later than start time.");
        }
        else {
            setCreatingEvent(true);
            const docRef = await addDoc(collection(db, "events"),
                {   title,
                    startTime,
                    endTime,
                    description,
                    uid: authCtx.uid,
                    rsvps: [authCtx.uid]
                });
            eventsCtx.addEvent(createEventFromDoc(await getDoc(docRef)));
            setCreatingEvent(false);
            Alert.alert("Event created!");
            navigation.goBack(null);
        }
    }

    async function updateEvent() {
        if (title === "") {
            Alert.alert("Your event needs a title!");
        }
        else if (endTime <= startTime) {
            Alert.alert("End time must be later than start time.");
        }
        else {
            setUpdatingEvent(true);
            const docRef = doc(db, "events", event.docId);
            await updateDoc(docRef, { title, startTime, endTime, description });
            eventsCtx.updateEvent(createEventFromDoc(await getDoc(docRef)));
            setUpdatingEvent(false);
            Alert.alert("Event updated!");
            navigation.goBack(null);
        }
    }

    if (creatingEvent) {
        return <LoadingOverlay message="Creating event..."/>
    }
    if (updatingEvent) {
        return <LoadingOverlay message="Updating event..."/>
    }

    return (
        <View style={styles.rootContainer}>
            <Input placeholder="Event title" defaultValue={title} onChangeText={setTitle} />
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>Start time:</Text>
                <RNDateTimePicker value={startTime} mode="datetime" onChange={(_, date) => setStartTime(date)} />
            </View>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>End time:</Text>
                <RNDateTimePicker value={endTime} mode="datetime" onChange={(_, date) => setEndTime(date)} />
            </View>
            <TextInput style={styles.eventDescription} placeholder="Enter a description here..."
                multiline={true} numberOfLines={5} defaultValue={description} onChangeText={setDescription} />
            {!event && <Button title="Create event" onPress={addEvent} />}
            {event && <Button title="Update event" onPress={updateEvent} />}
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