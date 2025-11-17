// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
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

// Ensure anonymous user
export function ensureAnonymousUser(callback) {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      callback(user);
    } else {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Error signing in anonymously:", err);
      }
    }
  });

  return unsubscribe;
}

// Ensure default shelf exists, return its ref
export async function ensureDefaultShelf(userId) {
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
  }

  return shelfRef;
}

export function getDefaultShelfRefs(userId) {
  const shelfRef = doc(db, "users", userId, "fidgetShelves", "default");
  const booksColRef = collection(shelfRef, "books");
  return { shelfRef, booksColRef };
}

// Seed starter books only if collection is empty
export async function seedInitialBooksIfEmpty(userId) {
  const { booksColRef } = getDefaultShelfRefs(userId);
  const snapshot = await getDocs(booksColRef);

  if (!snapshot.empty) {
    return; // already has books, do nothing
  }

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
        label: book.label,
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

// Subscribe to books on the default shelf
export function subscribeToBooks(userId, handleBooks, handleError) {
  const { booksColRef } = getDefaultShelfRefs(userId);

  return onSnapshot(
    booksColRef,
    (snapshot) => {
      const books = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          label: data.label || "Book",
          title: data.title || data.label || "Book",
          color: data.color || "#ffffff",
          thumbnailUrl: data.thumbnailUrl || null,
          pageCount:
            typeof data.pageCount === "number" ? data.pageCount : null,
          shelfIndex:
            typeof data.shelfIndex === "number" ? data.shelfIndex : null,
          shelfPos:
            typeof data.shelfPos === "number" ? data.shelfPos : null,
        };
      });
      handleBooks(books);
    },
    (error) => {
      console.error("Error subscribing to books:", error);
      if (handleError) handleError(error);
    }
  );
}

// Update shelf index and horizontal position on the shelf
export async function updateBookShelfPosition(
  userId,
  bookId,
  shelfIndex,
  shelfPos = null
) {
  const { booksColRef } = getDefaultShelfRefs(userId);
  const bookRef = doc(booksColRef, bookId);

  await updateDoc(bookRef, {
    shelfIndex,
    shelfPos: shelfIndex === null ? null : shelfPos,
    updatedAt: serverTimestamp(),
  });
}
export async function deleteBook(userId, bookId) {
  const { booksColRef } = getDefaultShelfRefs(userId);
  const bookRef = doc(booksColRef, bookId);
  await deleteDoc(bookRef);
}
export async function resetAndSeedRandomBooks(userId) {
  const { shelfRef, booksColRef } = getDefaultShelfRefs(userId);

  // Clear existing books
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
      title,
      label: title,
      authors: [],
      googleVolumeId: null,
      thumbnailUrl: null,
      pageCount: null,
      color: pickColorForVolumeId(title),
      shelfIndex: null, // tray
      shelfPos: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

// Generate a distinct-ish color for each volume based on its id/title
function pickColorForVolumeId(volumeIdOrTitle) {
  const str = volumeIdOrTitle || "book";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360; // 0–359
  const saturation = 65; // %
  const lightness = 52; // %
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Add a book from a Google Books volume into the default shelf
export async function addBookFromGoogleVolume(userId, volume) {
  if (!userId || !volume) return;

  const { booksColRef } = getDefaultShelfRefs(userId);

  const info = volume.volumeInfo || {};
  const title = info.title || "Untitled";
  const authors = Array.isArray(info.authors) ? info.authors : [];
  const thumbnail =
    info.imageLinks && info.imageLinks.thumbnail
      ? info.imageLinks.thumbnail
      : null;
  const pageCount =
    typeof info.pageCount === "number" ? info.pageCount : null;

// Label for the spine — use full title, wrapping will handle length
const spineLabel = title;

  const color = pickColorForVolumeId(volume.id || title);

  const bookRef = doc(booksColRef); // auto id

  await setDoc(bookRef, {
    id: bookRef.id,
    googleVolumeId: volume.id || null,
    title,
    authors,
    thumbnailUrl: thumbnail,
    pageCount,
    label: spineLabel,
    color,
    shelfIndex: null, // start in tray
    shelfPos: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return bookRef.id;
}

export { auth, db };
