import { useContext, useEffect, useState, useRef } from 'react';
import { Alert, StyleSheet, Text, View, TextInput, FlatList } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { collection, query, where, doc, getDocs, addDoc, getDoc, updateDoc } from "firebase/firestore";
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { DateTime } from "luxon";
import { Event } from './Events';
import Checkbox from 'expo-checkbox';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import { db, auth } from '../firebase';
import { UsersContext } from '../store/users-context';
import { EventsContext } from '../store/events-context';
import LoadingOverlay from './LoadingOverlay';
import { createEventFromDoc } from './Events';
import { Group } from '../utils/group';
import { googleApiKey } from '../api_key';

export default function CreateEventScreen({ navigation, ...props }) {
    const usersCtx = useContext(UsersContext);
    const eventsCtx = useContext(EventsContext);
    const placeText = useRef();

    const myUid = auth.currentUser.uid;
    const event = props?.route?.params?.event;

    const [title, setTitle] = useState(event ? event.title : "");
    const [startTime, setStartTime] = useState(event ? event.startTime : DateTime.now().toJSDate());
    const [endTime, setEndTime] = useState(event ? event.endTime : DateTime.now().plus({hours: 2}).toJSDate());
    const [description, setDescription] = useState(event ? event.description : "");
    const [friendsCanSee, setFriendsCanSee] = useState(event ? event.friendsCanSee : true);
    const [invitedGroups, setInvitedGroups] = useState(event?.invitedGroups ? event.invitedGroups : []);
    const [loadingStatus, setLoadingStatus] = useState("");
    const [placeData, setPlaceData] = useState(null);

    async function addEvent() {
        if (title === "") {
            Alert.alert("Your event needs a title!");
        }
        else if (endTime <= startTime) {
            Alert.alert("End time must be later than start time.");
        }
        else {
            setLoadingStatus("Creating event...");
            const event = placeData ? {
                title,
                startTime,
                endTime,
                description,
                uid: myUid,
                rsvps: [myUid],
                friendsCanSee,
                invitedGroups,
                locationName: placeData.name,
                locationAddress: placeData.formatted_address,
                locationCoords: placeData.coords
            } : {
                title,
                startTime,
                endTime,
                description,
                uid: myUid,
                rsvps: [myUid],
                friendsCanSee,
                invitedGroups,
                // @ts-ignore
                locationName: placeText.current?.getAddressText()
            };
            const docRef = await addDoc(collection(db, "events"), event);
            eventsCtx.addEvent(createEventFromDoc(await getDoc(docRef)));
            setLoadingStatus("");
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
            setLoadingStatus("Updating event...");
            const docRef = doc(db, "events", event.docId);
            await updateDoc(docRef,
                {   title,
                    startTime,
                    endTime,
                    description,
                    friendsCanSee,
                    invitedGroups
                });
            eventsCtx.updateEvent(createEventFromDoc(await getDoc(docRef)));
            setLoadingStatus("");
            Alert.alert("Event updated!");
            navigation.goBack(null);
        }
    }

    function renderGroupSelect(group: Group|undefined) {
        const title = group ? group.title : "All friends";
        function onPressFriends(checked: boolean) {
            setFriendsCanSee(checked);
        }
        function onPressGroup(checked: boolean) {
            if (checked) {
                setInvitedGroups([...invitedGroups, group.docId]);
            } else {
                setInvitedGroups(invitedGroups.filter((groupId: string) => (groupId !== group.docId)));
            }
        }
        const checked: boolean = group ? invitedGroups?.includes(group.docId) : friendsCanSee;
        return (
            <TouchableWithoutFeedback>
                <View style={{flexDirection: "row", borderColor: "#D4D4D4", borderWidth: 1, backgroundColor: "white", borderRadius: 20, padding: 12, margin: 5, alignItems: "center" }}>
                    <Text style={{flex: 1, marginLeft: 15, fontSize: 16}}>{title}</Text>
                    <Checkbox style={{borderRadius: 5}} value={checked}
                        onValueChange={(checked) => (group ? onPressGroup(checked) : onPressFriends(checked))} />
                </View>
            </TouchableWithoutFeedback>
        )
    }

    useEffect(() => {
        if (event) {
            // @ts-ignore
            placeText.current?.setAddressText(event.locationName);
        }
        async function loadGroupsAndWait() {
            setLoadingStatus("Loading...");
            await usersCtx.loadGroups(myUid);
            setLoadingStatus("");
        }
        loadGroupsAndWait();
    }, []);

    if (loadingStatus) {
        return <LoadingOverlay message={loadingStatus}/>
    }
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
                <View style={{zIndex: 10, marginTop: 10, marginBottom: 50}}>
                    <GooglePlacesAutocomplete
                        placeholder="Location"
                        ref={placeText}
                        onPress={(data, details = null) => {
                            async function getPlaceData() {
                                const placeId = data.place_id;
                                const response = await fetch(
                                    `https://maps.googleapis.com/maps/api/place/details/json?fields=name%2Cformatted_address%2Cgeometry&place_id=${placeId}&key=${googleApiKey}`
                                );
                                if (response["ok"]) {
                                    let locationData = (await response.json())["result"];
                                    const { lat, lng } = locationData["geometry"]["location"];
                                    locationData.coords = { latitude: lat, longitude: lng };
                                    setPlaceData(locationData);
                                }
                                else {
                                    Alert.alert("Location details could not be retrieved.");
                                    console.error(JSON.stringify(response));
                                }
                            }
                            getPlaceData();
                        }}
                        query={{
                            key: googleApiKey,
                            language: 'en',
                        }}
                        currentLocation={true}
                        styles={{
                            listView: {marginTop: 45, position: "absolute"},
                            separator: {height: 0.5, backgroundColor: '#c8c7cc'},
                            textInput: {
                                paddingVertical: 5,
                                paddingHorizontal: 15,
                                borderColor: "#DDDDDD",
                                borderWidth: 1,
                                height: 45
                            }
                            }}
                    />
                </View>
                <TextInput style={styles.eventDescription} placeholder="Enter a description here..."
                    multiline={true} numberOfLines={5} defaultValue={description} onChangeText={setDescription} />
                <View style={{marginTop: 15, marginBottom: 15, flex: 10}}>
                    <Text style={{fontSize: 18}}>Share with:</Text>
                    <FlatList style={{borderColor: "gray", borderWidth: 1, padding: 5}} data={[undefined, ...usersCtx.groups]}
                        renderItem={itemData => renderGroupSelect(itemData.item)} />
                </View>
                

                {!event && <Button title="Create event" onPress={addEvent} />}
                {event && <Button title="Update event" onPress={updateEvent} />}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
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
        borderColor: "gray",
        padding: 8,
        marginTop: 10,
        fontSize: 16
    },
});

