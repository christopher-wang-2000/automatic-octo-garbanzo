import { StatusBar } from 'expo-status-bar';
import { useState, useContext } from 'react';
import { Alert, StyleSheet, Text, View, TextInput, Button as TextButton } from 'react-native';
import { Button, Input } from 'react-native-elements'
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { collection, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { register } from './Auth';
import LoadingOverlay from '../screens/LoadingOverlay';
import { AuthContext } from '../store/auth-context';

export default function Register({ navigation }) {
  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredDisplayName, setEnteredDisplayName] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState('');

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCtx = useContext(AuthContext);

  async function registerHandler(email: string, displayName: string, password: string, confirmPassword: string) {
    email = email.trim().toLowerCase();
  
    const emailIsValid = email.includes('@');
    const displayNameIsValid = (displayName.length >= 2) && (displayName.length <= 20);
    const passwordIsValid = (password.length >= 6) && (password.length <= 20);
    const passwordsAreEqual = password === confirmPassword;
  
    if (!emailIsValid) {
      Alert.alert('Invalid email entered.');
    }
    else if (!displayNameIsValid) {
      Alert.alert('Display name must be between 2 and 20 characters long.');
    }
    else if (!passwordIsValid) {
      Alert.alert('Password must be between 6 and 20 characters long.');
    }
    else if (!passwordsAreEqual) {
      Alert.alert('Passwords do not match.');
    }
    else {
      setIsAuthenticating(true);

      try {
        const { token, uid } = await register(email, password);
        await addDoc(collection(db, "users"), { uid, email, displayName });
        setIsAuthenticating(false);
        authCtx.authenticate(token, email, uid);
      }
      catch (error) {
        console.log(error.response);
        Alert.alert("Account creation failed. Please try again later or contact the creator for support.");
        setIsAuthenticating(false);
      }
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Creating user..." />;
  }

  return (
    <View style={styles.container}>
        <Input placeholder="Email address" onChangeText={setEnteredEmail}/>
        <Input placeholder="Display name" onChangeText={setEnteredDisplayName}/>
        <Input placeholder="Password" onChangeText={setEnteredPassword} secureTextEntry={true}/>
        <Input placeholder="Confirm password" onChangeText={setEnteredConfirmPassword} secureTextEntry={true}/>
        <Button title="Register account" onPress={() => registerHandler(enteredEmail, enteredDisplayName, enteredPassword, enteredConfirmPassword)}/>
        <TextButton title="Sign in with existing account" onPress={() => navigation.navigate("Login")} />
    </View>
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