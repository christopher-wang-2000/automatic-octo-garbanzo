import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';

function CreateEventScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const [eventTitle, setEventTitle] = useState("");
    const [date, setDate] = useState(new Date());
    const [eventDescription, setEventDescription] = useState("");

    const onChange = (event: DateTimePickerEvent, selectedDate: Date) => {
        setDate(selectedDate);
    };

    async function addEvent() {
        await addDoc(collection(db, "events"), { title: eventTitle, timestamp: date, description: eventDescription, uid: authCtx.uid })
    }

    return (
        <View style={styles.rootContainer}>
            <Input placeholder="Event title" onChangeText={setEventTitle} />
            <RNDateTimePicker value={date} mode="date" onChange={onChange} />
            <RNDateTimePicker value={date} mode="time" onChange={onChange} />
            <TextInput style={styles.eventDescription} placeholder="Enter a description here..."
                multiline={true} numberOfLines={5} onChangeText={setEventDescription} />
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
    eventDescription: {
        flex: 4,
        borderWidth: 1,
        borderColor: "black",
        padding: 8
    }
});