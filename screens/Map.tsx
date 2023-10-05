import { useState, useEffect, useContext, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, Point, LatLng } from 'react-native-maps'
import { googleApiKey } from '../api_key';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';

import { Event } from './Events';
import { EventsContext } from '../store/events-context';

export default function MapScreen({ navigation, ...props }) {
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const [searchMarker, setSearchMarker] = useState(null);
    const eventsCtx = useContext(EventsContext);
    const isFocused = useIsFocused();

    const selectedEvent = props?.route?.params?.event;
    const searchMarkerRef = useRef();
    const markerRefs = useRef({});
    const mapRef = useRef();

    useEffect(() => {
        async function getLocation() {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const location = await Location.getCurrentPositionAsync({});
                setLocation(location);
                if (!selectedEvent) {
                    setRegion({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    });
                }
            }
        }
        getLocation();
    }, []);

    // move map to marker and display info when clicking "show in map" on events page
    useEffect(() => {
        if (selectedEvent) {
            setRegion({
                latitude: selectedEvent.locationCoords.latitude,
                longitude: selectedEvent.locationCoords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
            // delayed so that callout bubble doesn't get cut offscreen
            setTimeout(() => markerRefs.current[selectedEvent.docId].showCallout(), 100);
        }
        props.route.params.event = undefined; // reset prop
    }, [props?.route?.params?.event]);

    return (
        <View style={{flex: 1}}>
            <View style={{zIndex: 10}}>
                <GooglePlacesAutocomplete styles={{
                    container: {margin: 20},
                    listView: {marginTop: 44, position: "absolute"},
                    separator: {height: 0.5, backgroundColor: '#c8c7cc'},
                    textInput: {
                        paddingVertical: 5,
                        paddingHorizontal: 15,
                        borderColor: "#AAAAAA",
                        borderWidth: 1,
                      },
                }}
                    placeholder="Search for location"
                    onPress={(data, details = null) => {
                        // 'details' is provided when fetchDetails = true
                        const placeId = data.place_id;
                        console.log(placeId);
                        async function setMarker() {
                            const response = await fetch(
                                `https://maps.googleapis.com/maps/api/place/details/json?fields=name%2Cformatted_address%2Cgeometry&place_id=${placeId}&key=${googleApiKey}`
                            );
                            if (response["ok"]) {
                                let locationData = (await response.json())["result"];
                                const { lat, lng } = locationData["geometry"]["location"];
                                locationData.coord = { latitude: lat, longitude: lng };
                                setSearchMarker(locationData);
                                setRegion({
                                    latitude: lat,
                                    longitude: lng,
                                    latitudeDelta: 0.05,
                                    longitudeDelta: 0.05,
                                });
                                // delayed so that callout bubble doesn't get cut offscreen
                                // @ts-ignore
                                setTimeout(() => searchMarkerRef.current?.showCallout(), 100);
                            }
                            else {
                              Alert.alert("Location details could not be retrieved.");
                              console.log(JSON.stringify(response));
                            }
                        }
                        setMarker();
                    }}
                    query={{
                        key: googleApiKey,
                        language: 'en',
                    }}
                />
            </View>
            <View style={{flex: 1, position: "absolute", ...StyleSheet.absoluteFillObject}}>
                <MapView style={{ ...StyleSheet.absoluteFillObject}}
                    region={region}
                    showsUserLocation={true} >
                    {searchMarker && (
                        <Marker
                            ref={searchMarkerRef}
                            coordinate={searchMarker.coord}
                            title={searchMarker["name"]}
                            description={searchMarker["formatted_address"]}
                            pinColor='blue'
                        />
                    )}
                    {eventsCtx.events.map((event: Event) => (
                        <Marker
                            ref={(element) => markerRefs.current[event.docId] = element}
                            key={event.docId}
                            coordinate={event.locationCoords}
                            title={`Event: ${event.title}`}
                            description={event.locationAddress}
                        />
                    ))}
                </MapView>
            </View>
      </View>
    );
}