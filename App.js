import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button as TextButton } from 'react-native';
import { Button, Input } from 'react-native-elements'
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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
import MapScreen from './screens/Map';
import MyFriendsScreen from './screens/Friends';
import MyGroupsScreen from './screens/Groups';
import CreateGroupScreen from './screens/CreateGroup';
import LoadingOverlay from './screens/LoadingOverlay';

import { LogBox } from 'react-native';
import SettingsScreen from './screens/Settings';

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
    <Stack.Navigator >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}

const EventsStack = createNativeStackNavigator();
function EventsStackScreen() {
  return (
    <EventsStack.Navigator initialRouteName="My Events" >
      <EventsStack.Screen name="My Events" component={EventsScreen} />
      <EventsStack.Screen name="Create Event" component={CreateEventScreen} />
    </EventsStack.Navigator>
  );
}

const GroupsStack = createNativeStackNavigator();
function GroupsStackScreen() {
  return (
    <GroupsStack.Navigator initialRouteName="My Groups" >
      <GroupsStack.Screen name="My Groups" component={MyGroupsScreen} />
      <GroupsStack.Screen name="Create Group" component={CreateGroupScreen} />
    </GroupsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();
function MyTabs() {
  return (
    <Tab.Navigator initialRouteName="Events" screenOptions={{unmountOnBlur: true}}>
      <Tab.Screen name="Events" component={EventsStackScreen} options={{headerShown: false, unmountOnBlur: false}} />
      <Tab.Screen name="Map" component={MapScreen} options={{unmountOnBlur: false}} />
      <Tab.Screen name="Friends" component={MyFriendsScreen} options={{unmountOnBlur: false}} />
      <Tab.Screen name="Groups" component={GroupsStackScreen} options={{headerShown: false, unmountOnBlur: false}} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{unmountOnBlur: false}} />
    </Tab.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <UsersContextProvider>
      <EventsContextProvider>
        {/* <Stack.Navigator
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
        </Stack.Navigator> */}
        <MyTabs />
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
