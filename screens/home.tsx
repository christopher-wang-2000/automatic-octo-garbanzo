import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { collection, query, where, getDocs } from "firebase/firestore";

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';

function WelcomeScreen() {
    const authCtx = useContext(AuthContext);
    const [userEvents, setUserEvents] = useState([]);

    useEffect(() => {
        async function getUserEvents() {
            const q = query(collection(db, "events"), where("uid", "==", authCtx.uid));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs;
        }
        console.log(getUserEvents());
    })

    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>Welcome {authCtx.email}!</Text>
            <Text>{authCtx.uid}</Text>
            <Text>You authenticated successfully!</Text>
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