import { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps'
import { googleApiKey } from '../api_key';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

export default function MapScreen({ navigation }) {
    return (
        <View style={{flex: 1}}>
            <View style={{zIndex: 1000}}>
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
                        console.log(data, details);
                    }}
                    query={{
                        key: googleApiKey,
                        language: 'en',
                    }}
                />
            </View>
            <View style={{flex: 1}}>
            <MapView style={{ ...StyleSheet.absoluteFillObject}} initialRegion={{
                latitude: 33.7872131,
                longitude: -84.381931,
                latitudeDelta: .005,
                longitudeDelta: .005
            }} />
            </View>
      </View>
    );
}