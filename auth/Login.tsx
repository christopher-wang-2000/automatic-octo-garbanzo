import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View, TextInput, Button as TextButton } from 'react-native';
import { Button, Input } from 'react-native-elements'
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { login } from './Auth';
import LoadingOverlay from './LoadingOverlay';

export default function Login({ navigation }) {
  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  async function loginHandler(email: string, password: string) {
    email = email.trim().toLowerCase();
    setIsAuthenticating(true);
    await login(email, password).catch(error => Alert.alert("Login failed. Check your credentials or try again later."));
    setIsAuthenticating(false);
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Logging in.." />;
  }

  return (
    <View style={styles.container}>
        <Input placeholder="Email address" onChangeText={setEnteredEmail}/>
        <Input placeholder="Password" onChangeText={setEnteredPassword} secureTextEntry={true}/>
        <Button title="Log in" onPress={() => loginHandler(enteredEmail, enteredPassword)} />
        <TextButton title="Don't have an account? Register here" onPress={() => navigation.navigate("Register")} />
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
