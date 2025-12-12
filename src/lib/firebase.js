// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function createFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = createFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- USER DOC (ANCHOR) ----------

async function ensureUserDoc(userId) {
  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      anon: true,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    },
    { merge: true }
  );
  return userRef;
}

// ---------- AUTH ----------

export function ensureAnonymousUser(callback) {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    try {
      let u = user;

      if (!u) {
        const cred = await signInAnonymously(auth);
        u = cred.user;
      }

      // STEP 2: ensure users/{uid} exists so Firestore doesn't show "doc does not exist"
      if (u?.uid) {
        await ensureUserDoc(u.uid);
      }

      if (u) callback(u);
    } catch (err) {
      console.error("Error ensuring anonymous user:", err);
    }
  });

  return unsubscribe;
}

// ---------- SHELF REFS ----------

export async function ensureDefaultShelf(userId) {
  // Ensure parent exists (safe even if called elsewhere)
  await ensureUserDoc(userId);

  const shelfRef = doc(db, "users", userId, "fidgetShelves", "default");
  const snap = await getDoc(shelfRef);

  if (!snap.exists()) {
    await setDoc(shelfRef, {
      name: "My Default Shelf",
      roomStyleId: "cozy_living_room",
      bookcaseStyleId: "dark_wood",
      layoutId: "3_shelves",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Optional: touch updatedAt so you can sort/track activity
    await updateDoc(shelfRef, { updatedAt: serverTimestamp() }).catch(() => {});
  }

  return shelfRef;
}

export function getDefaultShelfRefs(userId) {
  const shelfRef = doc(db, "users", userId, "fidgetShelves", "default");
  const booksColRef = collection(shelfRef, "books");
  return { shelfRef, booksColRef };
}

// ---------- SEED STARTER BOOKS ----------

export async function seedInitialBooksIfEmpty(userId) {
  const { booksColRef } = getDefaultShelfRefs(userId);
  const snapshot = await getDocs(booksColRef);

  if (!snapshot.empty) return;

  const starterBooks = [
    { id: "b1", label: "Book 1", color: "#f97316" },
    { id: "b2", label: "Book 2", color: "#22c55e" },
    { id: "b3", label: "Book 3", color: "#6366f1" },
    { id: "b4", label: "Book 4", color: "#e11d48" },
    { id: "b5", label: "Book 5", color: "#a855f7" },
  ];

  for (const book of starterBooks) {
    const bookRef = doc(booksColRef, book.id);
    await setDoc(
      bookRef,
      {
        id: book.id,
        type: "book",
        label: book.label,
        title: book.label,
        color: book.color,
        shelfIndex: null,
        shelfPos: null,
        thumbnailUrl: null,
        pageCount: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

// ---------- SUBSCRIBE TO ITEMS (BOOKS + DECOR) ----------

export function subscribeToBooks(userId, handleItems, handleError) {
  const { booksColRef } = getDefaultShelfRefs(userId);

  return onSnapshot(
    booksColRef,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        const type = data.type || "book";

        return {
          id: docSnap.id,
          type,
          label: data.label || data.title || "Book",
          title: data.title || data.label || "Book",
          color: data.color || "#ffffff",
          thumbnailUrl: data.thumbnailUrl || null,
          pageCount: typeof data.pageCount === "number" ? data.pageCount : null,

          // decor fields
          decorKind: data.decorKind || null,
          decorVariant: data.decorVariant ?? null,

          shelfIndex: typeof data.shelfIndex === "number" ? data.shelfIndex : null,
          shelfPos: typeof data.shelfPos === "number" ? data.shelfPos : null,
        };
      });

      handleItems(items);
    },
    (error) => {
      console.error("Error subscribing to items:", error);
      if (handleError) handleError(error);
    }
  );
}

// ---------- POSITION / DELETE ----------

export async function updateBookShelfPosition(userId, itemId, shelfIndex, shelfPos = null) {
  const { booksColRef } = getDefaultShelfRefs(userId);
  const itemRef = doc(booksColRef, itemId);

  await updateDoc(itemRef, {
    shelfIndex,
    shelfPos: shelfIndex === null ? null : shelfPos,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBook(userId, itemId) {
  const { booksColRef } = getDefaultShelfRefs(userId);
  const itemRef = doc(booksColRef, itemId);
  await deleteDoc(itemRef);
}

// ---------- RESET / DEMO SEED ----------

export async function resetAndSeedRandomBooks(userId) {
  const { booksColRef } = getDefaultShelfRefs(userId);

  // Clear existing
  const existing = await getDocs(booksColRef);
  const batch = writeBatch(db);
  existing.forEach((snap) => batch.delete(snap.ref));

  const demoTitles = [
    "The Clockwork Library",
    "Shadows in the Stacks",
    "Midnight at Cozy & Content",
    "The Secret Shelf",
    "Lanterns Over Willow Creek",
    "Blood, Ink, and Dust",
    "Spectral Editions",
    "The Lost Ledger",
  ];

  demoTitles.forEach((title) => {
    const ref = doc(booksColRef);
    batch.set(ref, {
      id: ref.id,
      type: "book",
      title,
      label: title,
      authors: [],
      googleVolumeId: null,
      thumbnailUrl: null,
      pageCount: null,
      color: pickColorForVolumeId(title),
      shelfIndex: null,
      shelfPos: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

// ---------- COLOR HELPER ----------

function pickColorForVolumeId(volumeIdOrTitle) {
  const str = volumeIdOrTitle || "book";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const saturation = 65;
  const lightness = 52;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// ---------- ADD BOOK FROM GOOGLE ----------

export async function addBookFromGoogleVolume(userId, volume) {
  if (!userId || !volume) return;

  const { booksColRef } = getDefaultShelfRefs(userId);

  const info = volume.volumeInfo || {};
  const title = info.title || "Untitled";
  const authors = Array.isArray(info.authors) ? info.authors : [];
  const thumbnail =
    info.imageLinks && info.imageLinks.thumbnail ? info.imageLinks.thumbnail : null;
  const pageCount = typeof info.pageCount === "number" ? info.pageCount : null;

  const spineLabel = title;
  const color = pickColorForVolumeId(volume.id || title);

  const bookRef = doc(booksColRef);

  await setDoc(bookRef, {
    id: bookRef.id,
    type: "book",
    googleVolumeId: volume.id || null,
    title,
    label: spineLabel,
    authors,
    thumbnailUrl: thumbnail,
    pageCount,
    color,
    shelfIndex: null,
    shelfPos: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return bookRef.id;
}

// ---------- ADD DECOR ----------

export async function addDecorItem(userId, decorKind, variantIndex = 1) {
  if (!userId) return;

  const { booksColRef } = getDefaultShelfRefs(userId);
  const ref = doc(booksColRef);

  let label = "Decor";
  if (decorKind === "plant") label = "Plant";
  else if (decorKind === "candle") label = "Candle";
  else if (decorKind === "bookend") label = "Bookends";

  await setDoc(ref, {
    id: ref.id,
    type: "decor",
    label,
    title: label,
    decorKind,
    decorVariant: Number.isFinite(variantIndex) ? variantIndex : 1,
    shelfIndex: null,
    shelfPos: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export { auth, db };
