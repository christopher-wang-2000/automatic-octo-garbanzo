import { collection, query, where, doc, addDoc, deleteDoc, updateDoc, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from '../firebase';

export enum FriendStatus { Incoming, Accepted, Outgoing };

export type Friend = { docId: string, uid: string, status: FriendStatus }

export async function loadFriends(myUid: string): Promise<Friend[]> {
    const q = query(collection(db, "friends"), where("uids", "array-contains", myUid));
    const querySnapshot = await getDocs(q);
    const friends = await Promise.all(querySnapshot.docs.map((doc) => createFriendFromDocument(doc, myUid)));
    return friends;
}

export async function sendFriendRequest(myUid: string, toUid: string): Promise<Friend> {
    const docRef = await addDoc(collection(db, "friends"), { accepted: false, uids: [myUid, toUid] });
    return { docId: docRef.id, uid: toUid, status: FriendStatus.Outgoing };
}

export async function acceptFriendRequest(friend: Friend): Promise<Friend> {
    await updateDoc(doc(db, "friends", friend.docId), { accepted: true } );
    friend.status = FriendStatus.Accepted;
    return friend;
}

export async function removeFriend(friend: Friend): Promise<void> {
    await deleteDoc(doc(db, "friends", friend.docId));
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