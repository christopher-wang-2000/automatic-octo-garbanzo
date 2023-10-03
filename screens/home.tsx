import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';

import { db, auth } from '../firebase';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

function WelcomeScreen({ navigation }) {
    const myUid: string = auth.currentUser.uid;
    const [googleLoginInfo, setGoogleLoginInfo] = useState(undefined);
    
    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>Welcome to Join.up!</Text>
            <Text style={{marginBottom: 10}}>Logged in as: {auth.currentUser.email}</Text>
            <Button style={styles.button} title="Upcoming events" onPress={() => navigation.navigate("Events", { title: "Upcoming events" })}></Button>
            {/* <Button style={styles.button} title="Events I'm going to" onPress={() => navigation.navigate("Events", { title: "Events I'm going to", rsvpdOnly: true })}></Button> */}
            <Button style={styles.button} title="Past events" onPress={() => navigation.navigate("Events", { title: "Past events", past: true })}></Button>
            <Button style={styles.button} title="My friends" onPress={() => navigation.navigate("My Friends")} />
            <Button style={styles.button} title="My groups" onPress={() => navigation.navigate("My Groups")} />
            {/* {!googleLoginInfo && <GoogleSigninButton style={styles.button} onPress={async () => setGoogleLoginInfo(await authCtx.googleLogin())} />}
            {googleLoginInfo && <Button style={styles.button} title="Log out of Google" onPress={async () => {
              if (await authCtx.googleLogout()) {
                setGoogleLoginInfo(null);
              }
            }} />} */}
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