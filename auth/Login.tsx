import { StatusBar } from 'expo-status-bar';
import { useState, useContext } from 'react';
import { Alert, StyleSheet, Text, View, TextInput, Button as TextButton } from 'react-native';
import { Button, Input } from 'react-native-elements'
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';

import { auth, provider } from '../firebase';
import LoadingOverlay from '../screens/LoadingOverlay';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

export default function Login({ navigation }) {
  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  async function loginHandler(email: string, password: string) {
    setIsAuthenticating(true);
    email = email.trim().toLowerCase();
    try {
      console.log("HELLO ", auth.currentUser?.email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("GOODBYE ", auth.currentUser?.email);
      setIsAuthenticating(false);
    }
    catch (error) {
      console.log(error.response);
      Alert.alert("Login failed. Check your credentials or try again later.");
      setIsAuthenticating(false);
    }
  }

  async function signInWithGoogle() {
    const { idToken } = await GoogleSignin.signIn();
    setIsAuthenticating(true);
    const googleCredential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, googleCredential);
    setIsAuthenticating(false);
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Logging in.." />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
          <Input placeholder="Email address" onChangeText={setEnteredEmail}/>
          <Input placeholder="Password" onChangeText={setEnteredPassword} secureTextEntry={true}/>
          <Button title="Log in" onPress={() => loginHandler(enteredEmail, enteredPassword)} />
          <Text style={{margin: 5, color: "gray"}}>or</Text>
          <GoogleSigninButton onPress={() => signInWithGoogle()} />
          <TextButton title="Don't have an account? Register here" onPress={() => navigation.navigate("Register")} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
