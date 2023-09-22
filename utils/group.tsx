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