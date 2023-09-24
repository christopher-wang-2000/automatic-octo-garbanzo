import { StatusBar } from 'expo-status-bar';
import { useState, useContext } from 'react';
import { Alert, StyleSheet, Text, View, TextInput, Button as TextButton } from 'react-native';
import { Button, Input } from 'react-native-elements'
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';

import { auth } from '../firebase';
import { collection, doc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import LoadingOverlay from '../screens/LoadingOverlay';
import { AuthContext } from '../store/auth-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Register({ navigation }) {
  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredFirstName, setEnteredFirstName] = useState('');
  const [enteredLastName, setEnteredLastName] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState('');

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCtx = useContext(AuthContext);

  async function registerHandler(email: string, firstName: string, lastName: string, password: string, confirmPassword: string) {
    email = email.trim().toLowerCase();
  
    const emailIsValid = email.includes('@');
    const firstNameIsValid = (firstName.length >= 1) && (firstName.length <= 20);
    const lastNameIsValid = (lastName.length >= 1) && (lastName.length <= 20);
    const passwordIsValid = (password.length >= 6) && (password.length <= 30);
    const passwordsAreEqual = password === confirmPassword;
  
    if (!emailIsValid) {
      Alert.alert('Invalid email entered.');
    }
    else if (!firstNameIsValid) {
      Alert.alert('First name must be between 1 and 20 characters long.');
    }
    else if (!lastNameIsValid) {
      Alert.alert('First name must be between 1 and 20 characters long.');
    }
    else if (!passwordIsValid) {
      Alert.alert('Password must be between 6 and 30 characters long.');
    }
    else if (!passwordsAreEqual) {
      Alert.alert('Passwords do not match.');
    }
    else {
      setIsAuthenticating(true);

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // const { token, uid } = await register(email, password);
        // await setDoc(doc(db, "users", uid),
        //   { uid, email, firstName, lastName, fullName: firstName + " " + lastName });
        // authCtx.authenticate(token, email, uid);
        const token = await userCredential.user.getIdToken();
        // const { token, uid } = await login(email, password);
        setIsAuthenticating(false);
        authCtx.authenticate(token, email, userCredential.user.uid);
      }
      catch (error) {
        console.log(error.response);
        Alert.alert("Account creation failed. Please try again later or contact the creator for support. (Maybe the email is already in use, or the server is down?)");
        setIsAuthenticating(false);
      }
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Creating user..." />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
          <Input placeholder="Email address" onChangeText={setEnteredEmail}/>
          <Input placeholder="First name" onChangeText={setEnteredFirstName}/>
          <Input placeholder="Last name" onChangeText={setEnteredLastName}/>
          <Input placeholder="Password" onChangeText={setEnteredPassword} secureTextEntry={true}/>
          <Input placeholder="Confirm password" onChangeText={setEnteredConfirmPassword} secureTextEntry={true}/>
          <Button title="Register account" onPress={() =>
            registerHandler(enteredEmail, enteredFirstName, enteredLastName, enteredPassword, enteredConfirmPassword)}/>
          <TextButton title="Sign in with existing account" onPress={() => navigation.navigate("Login")} />
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