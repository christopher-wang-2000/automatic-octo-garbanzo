import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { collection, query, where, getDocs, doc, addDoc, getDoc, updateDoc } from "firebase/firestore";
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { EventsContext } from '../store/events-context';
import LoadingOverlay from './LoadingOverlay';
import { createEventFromDoc } from './Events';

function UpdateEventScreen({ navigation, ...props }) {
    const authCtx = useContext(AuthContext);
    const eventsCtx = useContext(EventsContext);

    const eventId = props.route.params.eventId;
    const data = props.route.params.eventData;
    const [eventTitle, setEventTitle] = useState(data.title);
    const [startTime, setStartTime] = useState(data.startTime.toDate());
    const [description, setDescription] = useState(data.description);
    const [creatingEvent, setCreatingEvent] = useState(false);

    const onChange = (event: DateTimePickerEvent, selectedDate: Date) => {
        setStartTime(selectedDate);
    };

    async function updateEvent() {
        setCreatingEvent(true);
        const docRef = doc(db, "events", eventId);
        await updateDoc(docRef, { title: eventTitle, startTime, description });
        eventsCtx.updateEvent(createEventFromDoc(await getDoc(docRef)));
        setCreatingEvent(false);
        navigation.navigate("My Events");
    }

    if (creatingEvent) {
        return <LoadingOverlay message="Updating event..."/>
    }

    return (
        <View style={styles.rootContainer}>
            <Input placeholder="Event title" defaultValue={eventTitle} onChangeText={setEventTitle} />
            <RNDateTimePicker value={startTime} mode="date" onChange={onChange} />
            <RNDateTimePicker value={startTime} mode="time" onChange={onChange} />
            <TextInput style={styles.eventDescription} defaultValue={description} placeholder="Enter a description here..."
                multiline={true} numberOfLines={5} onChangeText={setDescription} />
            <Button title="Update event" onPress={updateEvent} />
        </View>
    );
}

export default UpdateEventScreen;

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
    eventDescription: {
        flex: 4,
        borderWidth: 1,
        borderColor: "black",
        padding: 8
    }
});