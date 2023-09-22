import { collection, query, where, doc, addDoc, deleteDoc, updateDoc, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from '../firebase';

export enum FriendStatus { Incoming, Accepted, Outgoing };

export type Friend = { docId: string, uid: string, status: FriendStatus }

export async function loadFriends(myUid: string, usersCtx, friendsCtx): Promise<Friend[]> {
    const q = query(collection(db, "friends"), where("uids", "array-contains", myUid));
    const querySnapshot = await getDocs(q);
    const friends = await Promise.all(querySnapshot.docs.map((doc) => createFriendFromDocument(doc, myUid)));
    await Promise.all(friends.map((friend: Friend) => usersCtx.loadUserAsync(friend.uid)));
    friendsCtx.setFriends(friends);
    return friends;
}

export async function sendFriendRequest(myUid: string, toUid: string, usersCtx, friendsCtx): Promise<Friend> {
    const docRef = await addDoc(collection(db, "friends"), { accepted: false, uids: [myUid, toUid] });
    await usersCtx.loadUserAsync(toUid);
    friendsCtx.addFriend(toUid);
    return { docId: docRef.id, uid: toUid, status: FriendStatus.Outgoing };
}

export async function acceptFriendRequest(friend: Friend, friendsCtx): Promise<Friend> {
    await updateDoc(doc(db, "friends", friend.docId), { accepted: true } );
    friend.status = FriendStatus.Accepted;
    friendsCtx.updateFriend(friend);
    return friend;
}

export async function removeFriend(friend: Friend, friendsCtx): Promise<void> {
    await deleteDoc(doc(db, "friends", friend.docId));
    friendsCtx.removeFriend(friend);
}

export function getFriendName(friend: Friend, usersCtx) {
    return usersCtx.getUser(friend.uid).fullName;
}

function createFriendFromDocument(
    friendDoc: QueryDocumentSnapshot<DocumentData, DocumentData>,
    myUid: string
    ): Friend {
    // get uid of friend from friendship document
    const data = friendDoc.data();
    const uidPair = data.uids;
    if (uidPair.length !== 2) {
        console.error("Unexpected format of friendship document");
        return undefined;
    }

    let status = FriendStatus.Accepted;
    let friendUid: string = "";
    if (uidPair[0] === myUid && uidPair[1] !== myUid) {
        friendUid = uidPair[1];
        status = data.accepted ? FriendStatus.Accepted : FriendStatus.Outgoing;
    }
    else if (uidPair[0] !== myUid && uidPair[1] === myUid) {
        friendUid = uidPair[0];
        status = data.accepted ? FriendStatus.Accepted : FriendStatus.Incoming;
    }
    else {
        console.error("Unexpected format of friendship document");
        return undefined;
    }

    return { docId: friendDoc.id, uid: friendUid, status };
}