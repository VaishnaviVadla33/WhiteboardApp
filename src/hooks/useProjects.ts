import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../config/firebase";
import type { Project } from "../types";

export function useProjects(uid: string) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "projects"), where("memberIds", "array-contains", uid));
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
    });
    return unsub;
  }, [uid]);

  async function createProject(name: string, ownerUid: string, ownerEmail: string) {
    await addDoc(collection(db, "projects"), {
      name,
      ownerId: ownerUid,
      memberIds: [ownerUid],
      memberEmails: [ownerEmail],
      createdAt: Date.now(),
    });
  }

  async function addMember(projectId: string, memberUid: string, memberEmail: string) {
    await updateDoc(doc(db, "projects", projectId), {
      memberIds: arrayUnion(memberUid),
      memberEmails: arrayUnion(memberEmail),
    });
  }

  async function removeMember(projectId: string, memberUid: string, memberEmail: string) {
    await updateDoc(doc(db, "projects", projectId), {
      memberIds: arrayRemove(memberUid),
      memberEmails: arrayRemove(memberEmail),
    });
  }

  return { projects, createProject, addMember, removeMember };
}