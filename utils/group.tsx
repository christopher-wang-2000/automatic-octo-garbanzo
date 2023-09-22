import { collection, query, where, doc, addDoc, deleteDoc, updateDoc, getDoc, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from '../firebase';

import { Friend } from "./friend";

export class Group {

    public docId: string;
    private data: DocumentData;

    public constructor(
        groupDoc: QueryDocumentSnapshot<DocumentData, DocumentData>
    ) {
        this.docId = groupDoc.id;
        this.data = groupDoc.data();
    }

    public static async makeFromId(docId: string): Promise<Group> {
        const groupDoc = await getDoc(doc(db, "groups", docId));
        return new Group(groupDoc);
    }

    get title(): string {
        return this.data.title;
    }
    get members(): Array<string> {
        return this.data.members;
    }
    get admins(): Array<string> {
        return this.data.admins;
    }
    get anyoneCanEdit(): boolean {
        return this.data.anyoneCanEdit;
    }
}

export async function loadGroups(myUid: string, usersCtx, groupsCtx): Promise<Group[]> {
    const q = query(collection(db, "groups"), where("members", "array-contains", myUid));
    const docs = (await getDocs(q)).docs;
    const groups = docs.map((d) => new Group(d));
    await Promise.all(groups.map((g) => 
        Promise.all(g.members.map(usersCtx.loadUserAsync))
    ));
    groupsCtx.setGroups(groups);
    return groups;
}

export async function createGroup(myUid: string, friends: Array<Friend>, title: string, anyoneCanEdit: boolean, groupsCtx): Promise<void> {
    const members: Array<string> = [myUid, ...friends.map((f) => f.uid)];
    const admins: Array<string> = [myUid];
    const docRef = await addDoc(collection(db, "groups"), { admins, members, title, anyoneCanEdit });
    groupsCtx.addGroup(await Group.makeFromId(docRef.id));
}