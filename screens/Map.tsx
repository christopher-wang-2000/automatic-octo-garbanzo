import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Point, LatLng } from 'react-native-maps'
import { googleApiKey } from '../api_key';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';

export default function MapScreen({ navigation }) {
    const [location, setLocation] = useState(null);
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        async function getLocation() {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const location = await Location.getCurrentPositionAsync({});
                console.log(location);
                setLocation(location);
            }
        }
        getLocation();
    }, []);

    return (
        <View style={{flex: 1}}>
            <View style={{zIndex: 10}}>
                <GooglePlacesAutocomplete styles={{
                    listView: {marginTop: 44, position: "absolute"},
                    separator: {height: 0.5, backgroundColor: '#c8c7cc'},
                    textInput: {
                        paddingVertical: 5,
                        paddingHorizontal: 15,
                        borderColor: "#DDDDDD",
                        borderWidth: 1
                      },
                }}
                    placeholder="Meeting location"
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
                                setMarkers([...markers, locationData]);
                                // console.log(locationData);
                                console.log(markers);
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
            <View style={{flex: 1}}>
                <MapView style={{ ...StyleSheet.absoluteFillObject}}
                    showsUserLocation={true} >
                    {markers.map((place, index) => (
                        <Marker
                            key={index}
                            coordinate={place.coord}
                            title={place["name"]}
                            description={place["formatted_address"]}
                        />
                    ))}
                </MapView>
            </View>
      </View>
    );
}