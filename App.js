import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button as TextButton } from 'react-native';
import { Button, Input } from 'react-native-elements'
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLoading from 'expo-app-loading';
import { MenuProvider } from 'react-native-popup-menu';

import Login from './auth/Login';
import Register from './auth/NewUser';
import AuthContextProvider from './store/auth-context'
import EventsContextProvider from './store/events-context';
import FriendsContextProvider from './store/friends-context';
import { AuthContext } from './store/auth-context';
import WelcomeScreen from './screens/home';
import EventsScreen from './screens/Events';
import CreateEventScreen from './screens/CreateEvent';
import MyFriendsScreen from './screens/Friends';

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <AuthContextProvider>
      <MenuProvider>
        <Navigation />
      </MenuProvider>
    </AuthContextProvider>
  );
}

function Root() {
  const [isTryingLogin, setIsTryingLogin] = useState(true);
  const authCtx = useContext(AuthContext);

  useEffect(async () => {
    const storedToken = await AsyncStorage.getItem('token')
      if (storedToken) {
          authCtx.authenticate(storedToken);
      }
      setIsTryingLogin(false);
    });

  if (isTryingLogin) {
    return <AppLoading />
  }
  return <Navigation />
}

function Navigation() {
  const authCtx = useContext(AuthContext);

  return (
    <NavigationContainer>
      {!authCtx.isAuthenticated && <AuthStack />}
      {authCtx.isAuthenticated && <AuthenticatedStack />}
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
  const authCtx = useContext(AuthContext);
  return (
    <EventsContextProvider>
      <FriendsContextProvider>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { },
            contentStyle: { },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{
            headerRight: () => <TextButton title="Log out" onPress={authCtx.logout} />}} />
          <Stack.Screen name="Events" component={EventsScreen} />
          <Stack.Screen name="Create Event" component={CreateEventScreen} />
          <Stack.Screen name="My Friends" component={MyFriendsScreen} />
        </Stack.Navigator>
      </FriendsContextProvider>
    </EventsContextProvider>
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
