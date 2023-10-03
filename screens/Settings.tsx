import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';

import { db, auth } from '../firebase';

export default function SettingsScreen({ navigation }) {
    const myUid: string = auth.currentUser.uid;
    const [googleLoginInfo, setGoogleLoginInfo] = useState(undefined);
    
    return (
        <View style={styles.rootContainer}>
            <Text style={{marginBottom: 10}}>Logged in as: {auth.currentUser.email}</Text>
            <Button style={styles.button} title="Log out" onPress={() => auth.signOut()} />
            {/* {!googleLoginInfo && <GoogleSigninButton style={styles.button} onPress={async () => setGoogleLoginInfo(await authCtx.googleLogin())} />}
            {googleLoginInfo && <Button style={styles.button} title="Log out of Google" onPress={async () => {
              if (await authCtx.googleLogout()) {
                setGoogleLoginInfo(null);
              }
            }} />} */}
        </View>
    );
}

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