import { collection, query, where, doc, addDoc, deleteDoc, updateDoc, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from '../firebase';

export enum FriendStatus { Incoming, Accepted, Outgoing };

export type Friend = { docId: string, uid: string, status: FriendStatus }
export const dummyFriend: Friend = { docId: null, uid: null, status: null }

export function createFriendFromDocument(
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