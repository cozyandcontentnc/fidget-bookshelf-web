"use client";

import { useEffect, useRef, useState } from "react";
import {
  ensureAnonymousUser,
  ensureDefaultShelf,
  seedInitialBooksIfEmpty,
  subscribeToBooks,
  updateBookShelfPosition,
  addBookFromGoogleVolume,
  deleteBook,
} from "@/lib/firebase";
const ROOM_THEMES = {
  cozy: {
    id: "cozy",
    label: "Cozy Bookstore",
    
    // NEW: real background image
    backgroundImage: "/themes/cozy-bookstore.png",

    // keep your bookcase + shelf styling
    bookcaseBackground:
      "linear-gradient(180deg, #1f2937 0, #111827 35%, #020617 100%)",
    shelfBackground:
      "linear-gradient(180deg, #273549 0, #111827 45%, #020617 100%)",
    bookcaseBorder: "#111827",
    shelfBorder: "#020617",
    accent: "#f97316",
  },

  fantasy: {
    id: "fantasy",
    label: "Arcane Library",

    // NEW
    backgroundImage: "/themes/fantasy-library.jpg",

    bookcaseBackground:
      "linear-gradient(180deg, #020617 0, #020617 30%, #020617 100%)",
    shelfBackground:
      "linear-gradient(180deg, #111827 0, #020617 65%, #020617 100%)",
    bookcaseBorder: "#312e81",
    shelfBorder: "#1e1b4b",
    accent: "#6366f1",
  },

  neon: {
    id: "neon",
    label: "Sci-Fi Archive",

    // NEW
    backgroundImage: "/themes/scifi-room.jpg",

    bookcaseBackground:
      "linear-gradient(180deg, #020617 0, #020617 40%, #020617 100%)",
    shelfBackground:
      "linear-gradient(180deg, #0f172a 0, #020617 60%, #020617 100%)",
    bookcaseBorder: "#22c55e",
    shelfBorder: "#0f766e",
    accent: "#22c55e",
  },
};


const SHELVES = [0, 1, 2];

// Book spine component
function BookSpine({ book, draggingBookId, onDragStart, onDragEnd }) {
  const isDragging = draggingBookId === book.id;
  const label = book.label || book.title || "Book";

  const hasCover = !!book.thumbnailUrl;
 // More realistic book proportions
const labelLen = label.length;

  // Thickness based on page count when available
  let widthRem;
  if (book.pageCount && book.pageCount > 0) {
    const minPages = 120;
    const maxPages = 900;
    const clampedPages = Math.min(
      Math.max(book.pageCount, minPages),
      maxPages
    );
    const t = (clampedPages - minPages) / (maxPages - minPages); // 0–1
// Width (thickness): 0.9–2rem depending on title length
const minWidth = 0.9;
const maxWidth = 2.0;
const widthRem =
  minWidth +
  (Math.min(labelLen, 40) / 40) * (maxWidth - minWidth);
  } else {
    // Fallback: label length
    const minWidth = 0.7;
    const maxWidth = 1.4;
    widthRem =
      minWidth + (Math.min(labelLen, 28) / 28) * (maxWidth - minWidth);
  }

// Height: 5.8–9rem depending on title length
const minHeight = 5.8;
const maxHeight = 9;
const heightRem =
  minHeight +
  (Math.min(labelLen, 40) / 40) * (maxHeight - minHeight);

  const spineColor = book.color || "#f97316";

  const backgroundImage = hasCover
    ? `linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.65)), url(${book.thumbnailUrl})`
    : `linear-gradient(
        to right,
        hsl(0 0% 100% / 0.18),
        ${spineColor},
        hsl(0 0% 0% / 0.3)
      )`;

  const backgroundSize = hasCover
    ? "100% 100%, auto 100%" // overlay + cover
    : "100% 100%";

  const backgroundPosition = hasCover
    ? "center center, left center" // left side of cover looks like spine
    : "center center";

  const backgroundRepeat = hasCover ? "no-repeat, no-repeat" : "no-repeat";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(book.id)}
      onDragEnd={onDragEnd}
      title={book.title || label}
style={{
  width: `${widthRem}rem`,
  height: `${heightRem}rem`,
  borderRadius: "0.18rem",

  // NEW realistic spine styles
  border: "1px solid rgba(15,23,42,0.95)",
  boxShadow: isDragging
    ? "0 0 0 2px #facc15, 0 10px 20px rgba(0,0,0,0.8)"
    : "0 6px 14px rgba(0,0,0,0.6)",
  transform: isDragging ? "translateY(-4px)" : "translateY(0)",
  transition: "transform 120ms ease, box-shadow 120ms ease",

  backgroundImage,
  backgroundSize,
  backgroundPosition,
  backgroundRepeat,
display: "flex",
alignItems: "center",      // was flex-end
justifyContent: "center",
paddingBottom: 0,          // no bottom bias
  fontSize: "0.46rem",
  color: "#f9fafb",
  writingMode: "vertical-rl",
  textOrientation: "mixed",
  cursor: "grab",
  opacity: isDragging ? 0.45 : 1,
  position: "relative",
  overflow: "hidden",
}}

    >
      {/* left highlight */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "0.16rem",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0.1))",
          opacity: 0.9,
          mixBlendMode: "soft-light",
          pointerEvents: "none",
        }}
      />
      {/* right shadow */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "0.18rem",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.2))",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />
      {/* top cap */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "0.12rem",
          right: "0.12rem",
          height: "0.22rem",
          background:
            "linear-gradient(to right, rgba(255,255,255,0.5), transparent)",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />
      {/* bottom page edge */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "0.12rem",
          right: "0.12rem",
          height: "0.22rem",
          background:
            "repeating-linear-gradient(to right, #f5f5f5 0, #e5e5e5 1px, #ffffff 2px)",
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
<span
  style={{
    zIndex: 1,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    fontWeight: 600,
    lineHeight: 1.1,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflow: "visible",
    textOverflow: "clip",
  }}
>
        {label}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [userId, setUserId] = useState(null);
  const [books, setBooks] = useState([]);
  const [draggingBookId, setDraggingBookId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const initializedRef = useRef(false);

  // Google Books search + overlay state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
const [themeId, setThemeId] = useState("cozy");
const theme = ROOM_THEMES[themeId] || ROOM_THEMES.cozy;

  // 1) Ensure we have an anonymous user
  useEffect(() => {
    const unsubscribe = ensureAnonymousUser((user) => {
      setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // 2) Once we have a user, ensure shelf + seed books + subscribe
  useEffect(() => {
    if (!userId || initializedRef.current) return;
    initializedRef.current = true;

    let unsubscribeBooks;

    (async () => {
      try {
        await ensureDefaultShelf(userId);
        await seedInitialBooksIfEmpty(userId);
        unsubscribeBooks = subscribeToBooks(
          userId,
          (booksFromDb) => {
            setBooks(booksFromDb);
            setLoading(false);
          },
          (err) => {
            console.error("Book subscription error:", err);
            setErrorMsg("Error loading books from server.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error initializing shelf/books:", err);
        setErrorMsg("Error initializing shelf.");
        setLoading(false);
      }
    })();

    return () => {
      if (unsubscribeBooks) unsubscribeBooks();
    };
  }, [userId]);

  const trayBooks = books.filter((b) => b.shelfIndex === null);

  const getBooksOnShelf = (shelfIndex) => {
    const shelfBooks = books.filter((b) => b.shelfIndex === shelfIndex);
    // Sort by shelfPos if present, otherwise keep current order
    return [...shelfBooks].sort((a, b) => {
      const aPos =
        typeof a.shelfPos === "number" ? a.shelfPos : Number.POSITIVE_INFINITY;
      const bPos =
        typeof b.shelfPos === "number" ? b.shelfPos : Number.POSITIVE_INFINITY;
      if (aPos === bPos) return 0;
      return aPos - bPos;
    });
  };

  function handleDragStart(bookId) {
    setDraggingBookId(bookId);
  }

  function handleDragEnd() {
    setDraggingBookId(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function moveBookToTray() {
    if (!draggingBookId || !userId) return;
    const bookId = draggingBookId;

    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId ? { ...b, shelfIndex: null, shelfPos: null } : b
      )
    );
    setDraggingBookId(null);

    try {
      await updateBookShelfPosition(userId, bookId, null, null);
    } catch (err) {
      console.error("Error moving book to tray:", err);
      setErrorMsg("Failed to move book. Try again.");
    }
  }
async function handleDeleteBookFromTray(bookId) {
  if (!userId) return;

  // Optimistic remove
  setBooks((prev) => prev.filter((b) => b.id !== bookId));

  try {
    await deleteBook(userId, bookId);
  } catch (err) {
    console.error("Error deleting book:", err);
    setErrorMsg("Failed to remove book.");
  }
}
async function handleRandomTrayFill() {
  if (!userId) return;
  setErrorMsg("");

  try {
    // Pick a random subject and starting offset
    const subjects = [
      "fiction",
      "fantasy",
      "mystery",
      "romance",
      "horror",
      "young+adult",
      "historical+fiction",
    ];
    const subject =
      subjects[Math.floor(Math.random() * subjects.length)];

    const startIndex = Math.floor(Math.random() * 40); // 0–39

    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${subject}&printType=books&maxResults=8&startIndex=${startIndex}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google Books error: ${res.status}`);
    }

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!items.length) {
      setErrorMsg("No random books found. Try again.");
      return;
    }

    // Append new books: do NOT clear existing ones
    await Promise.all(
      items.map((volume) => addBookFromGoogleVolume(userId, volume))
    );
  } catch (err) {
    console.error("Error fetching random books:", err);
    setErrorMsg("Failed to fetch random books. Try again.");
  }
}
async function moveBookToShelf(e, targetShelfIndex) {
  if (!draggingBookId || !userId) return;
  e.preventDefault();

  const bookId = draggingBookId;

  // Figure out where on the shelf we dropped (0–1 across the width)
  const rect = e.currentTarget.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const clampedX = Math.max(0, Math.min(rawX, rect.width));
  const shelfPos = rect.width > 0 ? clampedX / rect.width : 0.5;

  // Optimistic local update
  setBooks((prev) =>
    prev.map((b) =>
      b.id === bookId
        ? { ...b, shelfIndex: targetShelfIndex, shelfPos }
        : b
    )
  );
  setDraggingBookId(null);

  try {
    await updateBookShelfPosition(userId, bookId, targetShelfIndex, shelfPos);
  } catch (err) {
    console.error("Error moving book to shelf:", err);
    setErrorMsg("Failed to move book. Try again.");
  }
}

  function openSearchOverlay() {
    setIsSearchOpen(true);
    setSearchTerm("");
    setSearchResults([]);
    setSearchError("");
  }

  function closeSearchOverlay() {
    setIsSearchOpen(false);
    setSearchLoading(false);
    setSearchError("");
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    await performSearch();
  }

  async function performSearch() {
    const query = searchTerm.trim();
    if (!query) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&maxResults=20`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Books request failed: ${res.status}`);
      }

      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setSearchResults(items);

      if (items.length === 0) {
        setSearchError("No books found for that search.");
      }
    } catch (err) {
      console.error("Error searching Google Books:", err);
      setSearchError("Failed to fetch books. Try again.");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleAddBookFromSearch(volume) {
    if (!userId) {
      setSearchError("User not ready yet. Try again in a moment.");
      return;
    }
    try {
      await addBookFromGoogleVolume(userId, volume);
    } catch (err) {
      console.error("Error adding book from Google:", err);
      setSearchError("Failed to add book to shelf.");
    }
  }

  return (
<main
  style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundImage: `url(${theme.backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundColor: "#020617",
    color: "#f5f5f5",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  }}
>

    {/* DARK OVERLAY GOES HERE */}
<div
  style={{
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.25)", // softer dim, no blur
    pointerEvents: "none",
    zIndex: 0,
  }}
/>

      {/* Header */}
<header
  style={{
    padding: "1rem 2rem",
    borderBottom: "1px solid #27272a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  }}
>

        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Fidget Bookshelf</h1>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#a1a1aa" }}>
            Drag books between your tray and shelves. Layout is saved in
            Firebase. Add real books from Google Books.
          </p>
        </div>

<div style={{ display: "flex", gap: "0.4rem" }}>
  {Object.values(ROOM_THEMES).map((t) => {
    const active = t.id === themeId;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => setThemeId(t.id)}
        style={{
          padding: "0.3rem 0.7rem",
          borderRadius: "999px",
          border: active ? "1px solid #e5e5e5" : "1px solid #3f3f46",
          backgroundColor: active ? "#f9fafb" : "#27272a",
          color: active ? "#020617" : "#e4e4e7",
          fontSize: "0.75rem",
          cursor: "pointer",
          opacity: active ? 1 : 0.8,
        }}
      >
        {t.label}
      </button>
    );
  })}
</div>
      </header>

      {/* Main content area */}
<section
  style={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem 2rem",
    gap: "1.5rem",
    position: "relative",
    zIndex: 1,
  }}
>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flex: 1,
            minHeight: 0,
          }}
        >
{/* Left: Room + shelves */}
<div
  style={{
    flex: 3,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "1rem 0",
    background: "transparent",   // was big navy gradient
    position: "relative",
  }}
>

            {/* Fake background wall */}
            <div
              style={{
                position: "absolute",
                inset: "0",
                opacity: 0.15,
                backgroundImage: theme.wallOverlay,
                pointerEvents: "none",
              }}
            />

            {/* Bookcase box */}
            <div
style={{
  position: "relative",
  margin: "auto",
  marginTop: "1rem",
width: "55%",
maxWidth: "850px",
minWidth: "600px",
  minHeight: "20rem",
  borderRadius: "0.9rem",
  border: `2px solid ${theme.bookcaseBorder}`,
  background: theme.bookcaseBackground,
  boxShadow: "0 20px 45px rgba(0,0,0,0.9)",
  display: "flex",
  flexDirection: "column",
  padding: "0.9rem 0.9rem 1.1rem",
  gap: "0.65rem",
  overflow: "hidden",
}}

            >
              {/* inner frame / shadow to sell depth */}
<div
  style={{
    position: "absolute",
    inset: "0.45rem 0.45rem 0.6rem 0.45rem",
    borderRadius: "0.7rem",
    boxShadow:
      "inset 0 0 0 1px rgba(15,23,42,0.9), inset 0 18px 35px rgba(0,0,0,0.9)",
    pointerEvents: "none",
    zIndex: 0,
  }}
/>

{/* subtle side darkening to mimic uprights */}
<div
  style={{
    position: "absolute",
    top: "0.7rem",
    bottom: "0.9rem",
    left: "0.6rem",
    width: "0.55rem",
    borderRadius: "0.4rem",
    background:
      "linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.2))",
    pointerEvents: "none",
    zIndex: 0,
  }}
/>
<div
  style={{
    position: "absolute",
    top: "0.7rem",
    bottom: "0.9rem",
    right: "0.6rem",
    width: "0.55rem",
    borderRadius: "0.4rem",
    background:
      "linear-gradient(to left, rgba(0,0,0,0.7), rgba(0,0,0,0.2))",
    pointerEvents: "none",
    zIndex: 0,
  }}
/>
              {loading ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    color: "#a1a1aa",
                  }}
                >
                  Loading your shelf...
                </div>
              ) : (
                SHELVES.map((shelfIndex) => {
                  const shelfBooks = getBooksOnShelf(shelfIndex);
                  return (
                    <div
                      key={shelfIndex}
                      onDragOver={handleDragOver}
                      onDrop={(e) => moveBookToShelf(e, shelfIndex)}
style={{
  flex: 1,
  minHeight: "9.5rem",                 // taller shelves
  borderRadius: "0.4rem",
  border: `1px solid ${theme.shelfBorder}`,
  background: theme.shelfBackground,
  position: "relative",
  padding: "0.6rem 0.8rem 1.4rem",     // more top + bottom room inside
  overflow: "visible",
  zIndex: 1,
}}
                    >
                       {/* shelf board */}
  <div
    style={{
      position: "absolute",
      left: "0.8rem",
      right: "0.8rem",
      bottom: "0.4rem",
      height: "0.9rem",
      borderRadius: "0.5rem 0.5rem 0.3rem 0.3rem",
      background:
        "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(3,7,18,1))",
      boxShadow:
        "0 -2px 3px rgba(15,23,42,0.9), 0 4px 8px rgba(0,0,0,0.9)",
      pointerEvents: "none",
      zIndex: 1,
    }}
  />

  {/* front lip */}
  <div
    style={{
      position: "absolute",
      left: "1rem",
      right: "1rem",
      bottom: "0.15rem",
      height: "0.28rem",
      borderRadius: "0.25rem",
      background:
        "linear-gradient(to top, rgba(15,23,42,1), rgba(15,23,42,0.5))",
      boxShadow: "0 2px 4px rgba(0,0,0,1)",
      pointerEvents: "none",
      zIndex: 2,
    }}
  />

                      {shelfBooks.length === 0 ? (
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "#52525b",
                            fontStyle: "italic",
                            position: "absolute",
                            left: "0.5rem",
                            bottom: "0.5rem",
                          }}
                        >
                          
                        </div>
                      ) : null}

                      {shelfBooks.map((book, index) => {
                        const hasPos = typeof book.shelfPos === "number";
                        const fallbackPos =
                          (index + 1) / (shelfBooks.length + 1);
                        const pos = hasPos ? book.shelfPos : fallbackPos;
                        const leftPercent = pos * 100;

                        return (
                          <div
                            key={book.id}
                            style={{
                              position: "absolute",
                              bottom: "0.35rem",
                              left: `calc(${leftPercent}% - 0.7rem)`,
                            }}
                          >
                            <BookSpine
                              book={book}
                              draggingBookId={draggingBookId}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Info / instructions */}
          <aside
            style={{
              flex: 1,
              borderRadius: "1rem",
              border: "1px solid #27272a",
              backgroundColor: "#09090b",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
              How this works now
            </h2>
            <ol
              style={{
                margin: 0,
                paddingLeft: "1.3rem",
                fontSize: "0.9rem",
                color: "#a1a1aa",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <li>Anonymous user + default shelf per browser.</li>
              <li>Starter books are seeded only once if needed.</li>
              <li>
                Drag books between tray and shelves; layout (including
                position) is saved to Firestore.
              </li>
              <li>
                Use the floating <strong>+ Add Books</strong> button to pull
                titles from Google Books into your tray.
              </li>
            </ol>
            {errorMsg ? (
              <p style={{ fontSize: "0.8rem", color: "#f97373" }}>
                {errorMsg}
              </p>
            ) : (
              <p style={{ fontSize: "0.8rem", color: "#71717a" }}>
                Refresh the page and your books stay exactly where you left
                them.
              </p>
            )}
          </aside>
        </div>

        {/* Tray area */}
        <section
          style={{
            borderRadius: "0.75rem",
            border: "1px solid #27272a",
            backgroundColor: "#09090b",
            padding: "0.75rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
  }}
>
  <div style={{ display: "flex", flexDirection: "column" }}>
    <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Book tray</h3>
    <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
      Drag a book from here onto any shelf.
    </span>
  </div>
<button
  type="button"
  onClick={handleRandomTrayFill}
  style={{
    padding: "0.35rem 0.9rem",
    borderRadius: "999px",
    border: "1px solid #3f3f46",
    backgroundColor: "#18181b",
    color: "#e4e4e7",
    fontSize: "0.8rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
  }}
>
  Random books
</button>

</div>


          <div
            onDragOver={handleDragOver}
            onDrop={moveBookToTray}
            style={{
              minHeight: "5.4rem",
              borderRadius: "0.5rem",
              border: "1px dashed #3f3f46",
              background:
                "linear-gradient(to right, rgba(24,24,27,0.9), rgba(17,24,39,0.9))",
              display: "flex",
              alignItems: "flex-end",
              padding: "0.4rem",
              gap: "0.25rem",
              overflowX: "auto",
            }}
          >
            {loading ? (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#52525b",
                  fontStyle: "italic",
                }}
              >
                Loading books...
              </div>
            ) : trayBooks.length === 0 ? (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#52525b",
                  fontStyle: "italic",
                }}
              >
                No books in the tray. Drag from shelves to put them back.
              </div>
            ) : null}

{trayBooks.map((book) => (
  <div
    key={book.id}
    style={{ position: "relative", paddingRight: "0.3rem" }}
  >
    <BookSpine
      book={book}
      draggingBookId={draggingBookId}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    />
    <button
      type="button"
      onClick={() => handleDeleteBookFromTray(book.id)}
      title="Remove from tray"
      style={{
        position: "absolute",
        top: "-0.4rem",
        right: "-0.1rem",
        width: "1rem",
        height: "1rem",
        borderRadius: "999px",
        border: "none",
        backgroundColor: "rgba(15,23,42,0.9)",
        color: "#e5e5e5",
        fontSize: "0.7rem",
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      ×
    </button>
  </div>
))}
          </div>
        </section>
      </section>

      {/* Floating + Add Books button */}
      <button
        type="button"
        onClick={openSearchOverlay}
        style={{
          position: "fixed",
          right: "1.75rem",
          bottom: "1.75rem",
          width: "3.25rem",
          height: "3.25rem",
          borderRadius: "999px",
          border: "none",
background:
  `radial-gradient(circle at 30% 30%, ${theme.accent}, #111827)`,
          color: "#020617",
          fontSize: "1.6rem",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }}
        aria-label="Add books from Google Books"
      >
        +
      </button>

      {/* Google Books search overlay */}
      {isSearchOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "80vh",
              backgroundColor: "#020617",
              borderTopLeftRadius: "1.5rem",
              borderTopRightRadius: "1.5rem",
              border: "1px solid #27272a",
              boxShadow: "0 -20px 50px rgba(0,0,0,0.7)",
              padding: "1rem 1.25rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                  Add books from Google Books
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "#a1a1aa",
                  }}
                >
                  Search by title, author, or ISBN. Click “Add to tray” to
                  drop the book into your shelf tray.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSearchOverlay}
                style={{
                  borderRadius: "999px",
                  border: "1px solid #3f3f46",
                  backgroundColor: "transparent",
                  color: "#e4e4e7",
                  fontSize: "0.8rem",
                  padding: "0.25rem 0.7rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {/* Search form */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.25rem",
              }}
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search books by title, author, or ISBN..."
                style={{
                  flex: 1,
                  borderRadius: "999px",
                  border: "1px solid #27272a",
                  backgroundColor: "#020617",
                  color: "#e4e4e7",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={searchLoading}
                style={{
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(to right, #3b82f6, #6366f1)",
                  color: "#f9fafb",
                  padding: "0.45rem 1rem",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  opacity: searchLoading ? 0.7 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {searchLoading ? "Searching..." : "Search"}
              </button>
            </form>

            {/* Results */}
            <div
              style={{
                marginTop: "0.25rem",
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                paddingRight: "0.3rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {searchError && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#f97373",
                  }}
                >
                  {searchError}
                </div>
              )}

              {!searchLoading &&
                !searchError &&
                searchResults.length === 0 &&
                searchTerm.trim() && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#71717a",
                      fontStyle: "italic",
                    }}
                  >
                    No results yet. Try a different search.
                  </div>
                )}

              {searchResults.map((volume) => {
                const info = volume.volumeInfo || {};
                const title = info.title || "Untitled";
                const authors = Array.isArray(info.authors)
                  ? info.authors.join(", ")
                  : "Unknown author";
                const thumb =
                  info.imageLinks && info.imageLinks.thumbnail
                    ? info.imageLinks.thumbnail
                    : null;

                return (
                  <div
                    key={volume.id}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.6rem 0.4rem",
                      borderBottom: "1px solid #111827",
                    }}
                  >
                    <div
                      style={{
                        width: "3rem",
                        height: "4.2rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "#020617",
                        border: "1px solid #1f2933",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            color: "#52525b",
                            textAlign: "center",
                            padding: "0.25rem",
                          }}
                        >
                          No cover
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.2rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          color: "#e4e4e7",
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#a1a1aa",
                        }}
                      >
                        {authors}
                      </div>
                      {info.publisher && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#71717a",
                          }}
                        >
                          {info.publisher}
                          {info.publishedDate
                            ? ` • ${info.publishedDate}`
                            : ""}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleAddBookFromSearch(volume)}
                        style={{
                          borderRadius: "999px",
                          border: "none",
                          backgroundColor: "#22c55e",
                          color: "#022c22",
                          padding: "0.35rem 0.8rem",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Add to tray
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
