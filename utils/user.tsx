import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { db } from '../firebase';

export class User {

    public constructor(public userDoc: DocumentData) {}

    static async make(uid: string): Promise<User> {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        const docs = (await getDocs(q)).docs;
        if (docs.length === 0) {
            return undefined;
        }
        return new User(docs[0].data());
    }

    get uid(): string {
        return this.userDoc.uid;
    }
    get email(): string {
        return this.userDoc.email;
    }
    get name(): string {
        return this.userDoc.name;
    }
    get firstName(): string {
        return this.userDoc.firstName;
    }
    get lastName(): string {
        return this.userDoc.lastName;
    }
}