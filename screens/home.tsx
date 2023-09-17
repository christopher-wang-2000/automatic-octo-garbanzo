import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';
import { collection, query, where, getDocs } from "firebase/firestore";

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';

function WelcomeScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const [userEvents, setUserEvents] = useState([]);

    useEffect(() => {
        async function getUserEvents() {
            const q = query(collection(db, "events"), where("uid", "==", authCtx.uid));
            const querySnapshot = await getDocs(q);
            console.log(querySnapshot.docs);
            for (const doc of querySnapshot.docs) {
                console.log(doc.data());
            }
            setUserEvents(querySnapshot.docs);
        }
        getUserEvents();
    }, []);

    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>Welcome {authCtx.email}!</Text>
            <Text>{authCtx.uid}</Text>
            <Text>You authenticated successfully!</Text>
            <Button title="See my events" onPress={() => navigation.navigate("My Events")}></Button>
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