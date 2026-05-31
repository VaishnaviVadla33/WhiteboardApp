import { useEffect, useState, useRef } from "react";
import {
  collection, onSnapshot, addDoc,
  doc, setDoc, query, orderBy
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { DrawingStroke, CursorPosition } from "../types";

export function useWhiteboard(projectId: string, uid: string, displayName: string) {
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [permissionError, setPermissionError] = useState(false);
  const cursorThrottleRef = useRef<number>(0);

  // Listen to strokes in real time
  useEffect(() => {
    if (!projectId) return;
    const q = query(
      collection(db, "projects", projectId, "strokes"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setStrokes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DrawingStroke)));
        setPermissionError(false);
      },
      (error) => {
        console.error("Strokes listener error:", error);
        if (error.code === "permission-denied") {
          setPermissionError(true);
        }
      }
    );
    return unsub;
  }, [projectId]);

  // Listen to cursors in real time
  useEffect(() => {
    if (!projectId) return;
    const unsub = onSnapshot(
      collection(db, "projects", projectId, "cursors"),
      (snap) => {
        const now = Date.now();
        setCursors(
          snap.docs
            .map((d) => d.data() as CursorPosition)
            .filter((c) => c.uid !== uid && now - c.updatedAt < 5000)
        );
        setPermissionError(false);
      },
      (error) => {
        console.error("Cursors listener error:", error);
        if (error.code === "permission-denied") {
          setPermissionError(true);
        }
      }
    );
    return unsub;
  }, [projectId, uid]);

  async function saveStroke(stroke: Omit<DrawingStroke, "id">) {
    try {
      await addDoc(collection(db, "projects", projectId, "strokes"), stroke);
    } catch (error: any) {
      console.error("Save stroke error:", error);
      if (error.code === "permission-denied") {
        setPermissionError(true);
      }
    }
  }

  async function clearBoard() {
    try {
      const q = query(collection(db, "projects", projectId, "strokes"));
      const snap = await import("firebase/firestore").then(({ getDocs }) => getDocs(q));
      const { deleteDoc, doc } = await import("firebase/firestore");
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "projects", projectId, "strokes", d.id))));
    } catch (error: any) {
      console.error("Clear board error:", error);
      if (error.code === "permission-denied") {
        setPermissionError(true);
      }
    }
  }

  function updateCursor(x: number, y: number) {
    const now = Date.now();
    if (now - cursorThrottleRef.current < 50) return;
    cursorThrottleRef.current = now;
    setDoc(doc(db, "projects", projectId, "cursors", uid), {
      uid, displayName, x, y, updatedAt: now,
    }).catch((error: any) => {
      console.error("Update cursor error:", error);
      if (error.code === "permission-denied") {
        setPermissionError(true);
      }
    });
  }

  return { strokes, cursors, permissionError, saveStroke, clearBoard, updateCursor };
}