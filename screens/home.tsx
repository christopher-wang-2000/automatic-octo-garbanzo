import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';

function WelcomeScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const myUid: string = authCtx.uid;
    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>Welcome {authCtx.email}!</Text>
            <Button style={styles.button} title="Browse upcoming events" onPress={() => navigation.navigate("Events", { title: "Upcoming events" })}></Button>
            <Button style={styles.button} title="My RSVP'd events" onPress={() => navigation.navigate("Events", { title: "My RSVP'd events", rsvpdOnly: true })}></Button>
            <Button style={styles.button} title="My friends list" onPress={() => navigation.navigate("My Friends")}></Button>
        </View>
    );
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: "center"
  },
  button: {
    margin: 5,
  }
});