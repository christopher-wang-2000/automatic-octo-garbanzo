import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { db } from '../firebase';

export class User {

    private constructor(public userDoc: DocumentData) {}

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
    get fullName(): string {
        return this.userDoc.fullName;
    }
    get firstName(): string {
        return this.userDoc.lastName;
    }
    get lastName(): string {
        return this.userDoc.lastName;
    }
}