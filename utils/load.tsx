import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView, FlatList, RefreshControl, Pressable, Switch } from 'react-native';
import { Button } from 'react-native-elements';
import Modal from "react-native-modal";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { Checkbox } from 'expo-checkbox';
import { getCalendars } from 'expo-localization';
import RNCalendarEvents from "react-native-calendar-events";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { googleApiKey } from '../api_key';

import { collection, query, where, getDocs, orderBy, doc, deleteDoc, updateDoc, Query, DocumentData, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import { db, auth } from '../firebase';

import { EventsContext } from '../store/events-context';
import { UsersContext } from '../store/users-context';

import { User } from '../utils/user';
import { Friend } from '../utils/friend';
import { Group } from '../utils/group';

// export async function loadAllData(myUid: string, usersCtx, eventsCtx) {
//     const friendsPromise = usersCtx.loadFriends(myUid)
//     const groups = await usersCtx.loadGroups(myUid);
//     const friends = await friendsPromise;

//     const friendUids: Array<string> = friends.map((friend: Friend) => friend.uid);
//     const allUids: Array<string> = [myUid, ...friendUids];
//     const uidsToUse: Array<string> = (props?.route?.params?.uids) ? allUids.filter((uid) => props.route.params.uids.includes(uid)) : allUids;

//     let events: Array<Event>;
//     const timeframe = where("endTime", past ? "<=" : ">", Timestamp.fromDate(new Date()));
//     if (rsvpdOnly) {
//       const q = query(collection(db, "events"), where("rsvps", "array-contains", myUid), timeframe);
//       const querySnapshot = await getDocs(q);
//       events = querySnapshot.docs.map(createEventFromDoc);
//     }
//     else {
//     const myEventsQuery = query(collection(db, "events"), where("uid", "==", myUid), timeframe);
//     let snapshotPromises = [getDocs(myEventsQuery)];
//     if (friends.length > 0) {
//       const friendQuery = query(collection(db, "events"), where("friendsCanSee", "==", true), where("uid", "in", friends.map((f: Friend) => f.uid)), timeframe);
//       snapshotPromises.push(getDocs(friendQuery));
//     }
//     if (groups.length > 0) {
//       const groupQuery = query(collection(db, "events"), where("invitedGroups", "array-contains-any", groups.map((g: Group) => g.docId)), timeframe);
//       snapshotPromises.push(getDocs(groupQuery));
//     }
//     const snapshots = await Promise.all(snapshotPromises);
//     events = snapshots.flatMap((s) => s.docs).map(createEventFromDoc);
//     events = [...new Map(events.map((e) => [e.docId, e])).values()] // remove duplicates
//     }
//     eventsCtx.setEvents(events);
//     await Promise.all(events.map((e: Event) => usersCtx.loadUser(e.creatorUid)));
//     setRefreshing(false);
// }