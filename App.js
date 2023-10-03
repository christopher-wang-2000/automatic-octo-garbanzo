import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button as TextButton } from 'react-native';
import { Button, Input } from 'react-native-elements'
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuProvider } from 'react-native-popup-menu';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import Login from './auth/Login';
import Register from './auth/NewUser';
import { auth } from './firebase';

import EventsContextProvider from './store/events-context';
import UsersContextProvider from './store/users-context';

import WelcomeScreen from './screens/Home';
import EventsScreen from './screens/Events';
import CreateEventScreen from './screens/CreateEvent';
import MyFriendsScreen from './screens/Friends';
import MyGroupsScreen from './screens/Groups';
import CreateGroupScreen from './screens/CreateGroup';
import LoadingOverlay from './screens/LoadingOverlay';

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const Stack = createNativeStackNavigator();

export default function App() {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/calendar'],
    webClientId: '566822880515-htqgd1o219n75cto89c4k9105oq0qv4r.apps.googleusercontent.com',
  });
  return (
    <MenuProvider>
      <Navigation />
    </MenuProvider>
  );
}

// function Root() {
//   const [isTryingLogin, setIsTryingLogin] = useState(true);
//   const authCtx = useContext(AuthContext);

//   useEffect(async () => {
//     const storedToken = await AsyncStorage.getItem('token')
//       if (storedToken) {
//           authCtx.authenticate(storedToken);
//       }
//       setIsTryingLogin(false);
//     });

//   if (isTryingLogin) {
//     return <AppLoading />
//   }
//   return <Navigation />
// }

function Navigation() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  useEffect(() => {
    async function loadInitialAuth() {
      await auth.authStateReady();
      setIsLoading(false);
    }
    loadInitialAuth();
  }, []);
  auth.onAuthStateChanged((user) => setUser(user));
  return (
    <NavigationContainer>
      {isLoading && <LoadingOverlay message="Loading user..." />}
      {(!isLoading && !user) && <AuthStack />}
      {(!isLoading && user) && <AuthenticatedStack />}
    </NavigationContainer>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <UsersContextProvider>
      <EventsContextProvider>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { },
            contentStyle: { },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{
            headerRight: () => <TextButton title="Log out" onPress={() => { auth.signOut(); }} />}} />
          <Stack.Screen name="Events" component={EventsScreen} />
          <Stack.Screen name="Create Event" component={CreateEventScreen} />
          <Stack.Screen name="My Friends" component={MyFriendsScreen} />
          <Stack.Screen name="My Groups" component={MyGroupsScreen} />
          <Stack.Screen name="Create Group" component={CreateGroupScreen} />
        </Stack.Navigator>
      </EventsContextProvider>
    </UsersContextProvider>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });
