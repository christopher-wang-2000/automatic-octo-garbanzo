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
            <Text>{authCtx.uid}</Text>
            <Text>You authenticated successfully!</Text>
            <Button title="All events" onPress={() => navigation.navigate("My Events")}></Button>
            <Button title="My events" onPress={() => navigation.navigate("My Events", { uids: [myUid] })}></Button>
            <Button title="My friends" onPress={() => navigation.navigate("My Friends")}></Button>
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
  },
});