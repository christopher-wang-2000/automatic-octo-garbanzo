import { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, doc, addDoc, updateDoc, getDoc, deleteDoc, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { db } from '../firebase';
import { AuthContext } from '../store/auth-context';
import { UsersContext } from '../store/users-context';

import LoadingOverlay from './LoadingOverlay';
import { User } from '../utils/user';
import { FriendStatus, Friend } from '../utils/friend';
import { Group } from '../utils/group';

export default function MyGroupsScreen({ navigation }) {
    const authCtx = useContext(AuthContext);
    const usersCtx = useContext(UsersContext);
    const myUid = authCtx.uid;

    const [loadingMessage, setLoadingMessage] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    async function refreshGroups() {
        setRefreshing(true);
        await usersCtx.loadGroups(myUid);
        setRefreshing(false);
    }

    useEffect(() => {
        async function loadGroupsOnOpen() {
            setLoadingMessage("Loading groups...");
            await refreshGroups();
            setLoadingMessage("");
        }
        loadGroupsOnOpen();
    }, []);

    function renderGroup(group: Group) {
        
        return (
            <Menu key={group.docId} style={styles.group}>
                <MenuTrigger>
                    <Text style={{fontWeight: "bold"}}>{group.title}</Text>
                    <Text style={{fontStyle: "italic", marginBottom: 5}}>{group.members.length} members</Text>
                    {group.members.map((uid) => {
                        const user: User = usersCtx.getUser(uid);
                        return (
                            <Text id={uid} >{user?.fullName}</Text>
                        );
                    })}
                </MenuTrigger>
                <MenuOptions>

                </MenuOptions>
            </Menu>
        );
    }

    if (loadingMessage) {
        return <LoadingOverlay message={loadingMessage} />
    }

    return (
        <View style={styles.rootContainer}>
            <Text style={styles.title}>My Groups</Text>
            <View style={styles.addFriend}>
                <Button style={{marginBottom: 10}} title="Create group" onPress={() => navigation.navigate("Create Group")} />
            </View>
            <View style={styles.friendsContainer}>
                <FlatList data={usersCtx.groups} renderItem={itemData => renderGroup(itemData.item)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { refreshGroups(); }} />}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    addFriend: {
        flexDirection: "row",
        width: "80%",
        justifyContent: "center"
    },
    friendsContainer: {
        flex: 14,
        padding: 10,
        borderColor: "grey",
        borderWidth: 1,
        width: "80%"
    },
    group: {
        marginVertical: 5,
        padding: 10,
        backgroundColor: "lightgreen",
        borderRadius: 15
    },
});