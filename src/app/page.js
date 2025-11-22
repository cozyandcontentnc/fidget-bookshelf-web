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
  addDecorItem,
} from "@/lib/firebase";

const ROOM_THEMES = {
  cozy: {
    id: "cozy",
    label: "Cozy Bookstore",
    backgroundImage: "/themes/cozy-bookstore.png",
    bookcaseBackground:
      "linear-gradient(180deg, #3b2412 0%, #2a1609 40%, #1c0f06 100%)",
    shelfBackground:
      "linear-gradient(180deg, #5b3a1a 0, #3f2613 55%, #2a1609 100%)",
    bookcaseBorder: "#2a1609",
    shelfBorder: "#3b2412",
    accent: "#f97316",
  },

  fantasy: {
    id: "fantasy",
    label: "Arcane Library",
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
const MAX_TRAY_ITEMS = 18;

// ---------- BOOK SPINE ----------

function BookSpine({ book, draggingItemId, onDragStart, onDragEnd }) {
  const isDragging = draggingItemId === book.id;
  const label = book.label || book.title || "Book";
  const hasCover = !!book.thumbnailUrl;
  const labelLen = label.length;

  let widthRem;
  if (book.pageCount && book.pageCount > 0) {
    const minPages = 120;
    const maxPages = 900;
    const clampedPages = Math.min(
      Math.max(book.pageCount, minPages),
      maxPages
    );
    const t = (clampedPages - minPages) / (maxPages - minPages);
    const minWidth = 1.2;
    const maxWidth = 2.6;
    widthRem = minWidth + t * (maxWidth - minWidth);
  } else {
    const minWidth = 1.0;
    const maxWidth = 2.0;
    widthRem =
      minWidth + (Math.min(labelLen, 28) / 28) * (maxWidth - minWidth);
  }

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
    ? "100% 100%, auto 100%"
    : "100% 100%";

  const backgroundPosition = hasCover
    ? "center center, left center"
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
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 0,
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

// ---------- DECOR ITEM ----------

function DecorItem({ decor, draggingItemId, onDragStart, onDragEnd }) {
  const isDragging = draggingItemId === decor.id;
  const kind = decor.decorKind || "decor";

  function getClampedVariant(raw, maxVariant) {
    let v = raw;
    if (v === undefined || v === null) v = 1;
    v = parseInt(v, 10);
    if (!Number.isFinite(v)) v = 1;
    return Math.min(maxVariant, Math.max(1, v));
  }

  let imgSrc = "/decor/plant-1.png";
  let wrapperWidthRem = 9;
  let wrapperHeightRem = 10.5;

  if (kind === "plant") {
    const variant = getClampedVariant(decor.decorVariant, 5);
    imgSrc = `/decor/plant-${variant}.png`;
    wrapperWidthRem = 9;
    wrapperHeightRem = 10.5;
  } else if (kind === "candle") {
    const variant = getClampedVariant(decor.decorVariant, 4);
    imgSrc = `/decor/candle-${variant}.png`;
    wrapperWidthRem = 4.5;
    wrapperHeightRem = 5.8;
  } else if (kind === "bookend") {
    const variant = getClampedVariant(decor.decorVariant, 1);
    imgSrc = `/decor/bookends-${variant}.png`;
    wrapperWidthRem = 8.5;
    wrapperHeightRem = 7.5;
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(decor.id)}
      onDragEnd={onDragEnd}
      title={decor.title || decor.label || kind}
      style={{
        width: `${wrapperWidthRem}rem`,
        height: `${wrapperHeightRem}rem`,
        background: "transparent",
        border: "none",
        borderRadius: 0,
        boxShadow: "none",
        transform: isDragging ? "translateY(-4px)" : "none",
        opacity: isDragging ? 0.7 : 1,
        cursor: "grab",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "visible",
        pointerEvents: "auto",
        position: "relative",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={decor.title || decor.label || kind}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "bottom center",
          pointerEvents: "none",
          filter: isDragging
            ? "drop-shadow(0 10px 14px rgba(0,0,0,0.9))"
            : "drop-shadow(0 6px 10px rgba(0,0,0,0.75))",
        }}
      />
    </div>
  );
}

// ---------- MAIN PAGE ----------

export default function HomePage() {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const initializedRef = useRef(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Single active theme (cozy only, others hidden)
  const theme = ROOM_THEMES.cozy;

  const [showDecorTray] = useState(true);
  const [showDecorPalette, setShowDecorPalette] = useState(true);
  const [showPlantOptions, setShowPlantOptions] = useState(false);
  const [showCandleOptions, setShowCandleOptions] = useState(false);

  useEffect(() => {
    const unsubscribe = ensureAnonymousUser((user) => {
      setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || initializedRef.current) return;
    initializedRef.current = true;

    let unsubscribeItems;

    (async () => {
      try {
        await ensureDefaultShelf(userId);
        await seedInitialBooksIfEmpty(userId);
        unsubscribeItems = subscribeToBooks(
          userId,
          (itemsFromDb) => {
            setItems(itemsFromDb);
            setLoading(false);
          },
          (err) => {
            console.error("Item subscription error:", err);
            setErrorMsg("Error loading items from server.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error initializing shelf/items:", err);
        setErrorMsg("Error initializing shelf.");
        setLoading(false);
      }
    })();

    return () => {
      if (unsubscribeItems) unsubscribeItems();
    };
  }, [userId]);

  const trayItems = items.filter((i) => i.shelfIndex === null);
  const trayBooks = trayItems.filter((i) => i.type === "book" || !i.type);
  const trayDecor = trayItems.filter((i) => i.type === "decor");

  const getShelfItems = (shelfIndex) => {
    const shelfItems = items.filter((i) => i.shelfIndex === shelfIndex);
    return [...shelfItems].sort((a, b) => {
      const aPos =
        typeof a.shelfPos === "number" ? a.shelfPos : Number.POSITIVE_INFINITY;
      const bPos =
        typeof b.shelfPos === "number" ? b.shelfPos : Number.POSITIVE_INFINITY;
      if (aPos === bPos) return 0;
      return aPos - bPos;
    });
  };

  function handleDragStart(itemId) {
    setDraggingItemId(itemId);
  }

  function handleDragEnd() {
    setDraggingItemId(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function moveItemToTray(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!draggingItemId || !userId) return;

    const itemId = draggingItemId;

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, shelfIndex: null, shelfPos: null } : i
      )
    );
    setDraggingItemId(null);

    try {
      await updateBookShelfPosition(userId, itemId, null, null);
    } catch (err) {
      console.error("Error moving item to tray:", err);
      setErrorMsg("Failed to move item. Try again.");
    }
  }

  async function moveItemToShelf(e, targetShelfIndex) {
    if (!draggingItemId || !userId) return;
    e.preventDefault();

    const itemId = draggingItemId;

    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rawX, rect.width));
    const shelfPos = rect.width > 0 ? clampedX / rect.width : 0.5;

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, shelfIndex: targetShelfIndex, shelfPos }
          : i
      )
    );
    setDraggingItemId(null);

    try {
      await updateBookShelfPosition(userId, itemId, targetShelfIndex, shelfPos);
    } catch (err) {
      console.error("Error moving item to shelf:", err);
      setErrorMsg("Failed to move item. Try again.");
    }
  }

  async function handleDeleteItemFromTray(itemId) {
    if (!userId) return;

    setItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      await deleteBook(userId, itemId);
    } catch (err) {
      console.error("Error deleting item:", err);
      setErrorMsg("Failed to remove item.");
    }
  }

  async function handleRandomTrayFill() {
    if (!userId) return;
    setErrorMsg("");

    const currentTrayItems = items.filter((i) => i.shelfIndex === null);
    if (currentTrayItems.length >= MAX_TRAY_ITEMS) {
      setErrorMsg(
        "Tray is full. Move some items to a shelf or remove them."
      );
      return;
    }

    try {
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

      const startIndex = Math.floor(Math.random() * 40);

      const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${subject}&printType=books&maxResults=8&startIndex=${startIndex}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Books error: ${res.status}`);
      }

      const data = await res.json();
      const fetchedItems = Array.isArray(data.items) ? data.items : [];

      if (!fetchedItems.length) {
        setErrorMsg("No random books found. Try again.");
        return;
      }

      await Promise.all(
        fetchedItems.map((volume) => addBookFromGoogleVolume(userId, volume))
      );
    } catch (err) {
      console.error("Error fetching random books:", err);
      setErrorMsg("Failed to fetch random books. Try again.");
    }
  }

  async function handleAddDecor(decorKind, variantIndex) {
    if (!userId) return;

    const currentTrayItems = items.filter((i) => i.shelfIndex === null);
    if (currentTrayItems.length >= MAX_TRAY_ITEMS) {
      setErrorMsg(
        "Tray is full. Move some items to a shelf or remove them."
      );
      return;
    }

    try {
      await addDecorItem(userId, decorKind, variantIndex);
    } catch (err) {
      console.error("Error adding decor item:", err);
      setErrorMsg("Failed to add decor item.");
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
      const fetchedItems = Array.isArray(data.items) ? data.items : [];
      setSearchResults(fetchedItems);

      if (fetchedItems.length === 0) {
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

    const currentTrayItems = items.filter((i) => i.shelfIndex === null);
    if (currentTrayItems.length >= MAX_TRAY_ITEMS) {
      setSearchError(
        "Tray is full. Move some items to a shelf or remove them."
      );
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

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
            Build your dream shelf: drag books and decor between the tray and
            shelves. Your layout stays put, and you can pull in real titles
            using the “Add Books” search.
          </p>
        </div>

        {/* Single theme badge – other themes hidden for now */}
        <div
          style={{
            padding: "0.35rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.35)",
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Cozy Bookstore
        </div>
      </header>

      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 2rem",
          gap: "1.5rem",
          position: "relative",
          zIndex: 1,
          minHeight: 0,
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
          {/* LEFT: BOOKCASE */}
          <div
            style={{
              flex: 3,
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
              padding: "0.5rem 0 1rem",
              background: "transparent",
              position: "relative",
              minHeight: 0,
            }}
          >
            <div
              style={{
                position: "relative",
                margin: "auto",
                marginTop: 0,
                width: "55%",
                maxWidth: "850px",
                minWidth: "600px",
                height: "100%",
                borderRadius: "0.9rem",
                border: `2px solid ${theme.bookcaseBorder}`,
                background: theme.bookcaseBackground,
                boxShadow: "0 20px 45px rgba(0,0,0,0.9)",
                display: "flex",
                flexDirection: "column",
                padding: "0.9rem 0.9rem 1.1rem",
                gap: "0.65rem",
                overflow: "visible",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "0.45rem 0.45rem 0.6rem 0.45rem",
                  borderRadius: "0.7rem",
                  boxShadow:
                    "inset 0 0 0 1px rgba(40,22,10,0.9), inset 0 18px 35px rgba(30,15,5,0.9)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: "0.7rem",
                  bottom: "0.9rem",
                  left: "0.6rem",
                  width: "0.55rem",
                  borderRadius: "0.4rem",
                  background:
                    "linear-gradient(to right, rgba(45,25,10,0.75), rgba(85,55,25,0.25))",
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
                    "linear-gradient(to left, rgba(45,25,10,0.75), rgba(85,55,25,0.25))",
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
                    color: "#e5e7eb",
                  }}
                >
                  Loading your shelf...
                </div>
              ) : (
                SHELVES.map((shelfIndex) => {
                  const shelfItems = getShelfItems(shelfIndex);
                  return (
                    <div
                      key={shelfIndex}
                      onDragOver={handleDragOver}
                      onDrop={(e) => moveItemToShelf(e, shelfIndex)}
                      style={{
                        flex: 1,
                        minHeight: "9.5rem",
                        borderRadius: "0.4rem",
                        border: `1px solid ${theme.shelfBorder}`,
                        background: theme.shelfBackground,
                        position: "relative",
                        padding: "0.6rem 0.8rem 1.4rem",
                        overflow: "visible",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: "0.8rem",
                          right: "0.8rem",
                          bottom: "0.4rem",
                          height: "0.9rem",
                          borderRadius: "0.5rem 0.5rem 0.3rem 0.3rem",
                          background:
                            "linear-gradient(180deg, rgba(72,40,15,1), rgba(38,20,8,1))",
                          boxShadow:
                            "0 -2px 3px rgba(30,18,10,0.9), 0 4px 8px rgba(0,0,0,0.9)",
                          pointerEvents: "none",
                          zIndex: 1,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: "1rem",
                          right: "1rem",
                          bottom: "0.15rem",
                          height: "0.28rem",
                          borderRadius: "0.25rem",
                          background:
                            "linear-gradient(to top, #5c3317, #8b4513)",
                          boxShadow: "0 2px 4px rgba(0,0,0,1)",
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      />

                      {shelfItems.map((item, index) => {
                        const hasPos =
                          typeof item.shelfPos === "number";
                        const fallbackPos =
                          (index + 1) / (shelfItems.length + 1);
                        const pos = hasPos ? item.shelfPos : fallbackPos;
                        const leftPercent = pos * 100;

                        return (
                          <div
                            key={item.id}
                            style={{
                              position: "absolute",
                              bottom: "0.35rem",
                              left: `calc(${leftPercent}% - 0.7rem)`,
                              zIndex:
                                item.type === "decor" ? 4 : 3,
                            }}
                          >
                            {item.type === "decor" ? (
                              <DecorItem
                                decor={item}
                                draggingItemId={draggingItemId}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                              />
                            ) : (
                              <BookSpine
                                book={item}
                                draggingItemId={draggingItemId}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: "-1.2rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "calc(100% - 1.8rem)",
                  height: "1.2rem",
                  borderRadius: "0.3rem",
                  background:
                    "linear-gradient(180deg, #2a1609 0%, #1c0f06 60%, #120903 100%)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.7)",
                  zIndex: 0,
                }}
              />
            </div>
          </div>

          {/* RIGHT: BOOK TRAY PANEL */}
          <section
            style={{
              flex: 1,
              borderRadius: "1rem",
              border: `1px solid ${theme.shelfBorder}`,
              background: theme.bookcaseBackground,
              padding: "0.75rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.7rem",
              minHeight: 0,
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
                <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
                  Book tray
                </h3>
                <span
                  style={{ fontSize: "0.8rem", color: "#e5e7eb" }}
                >
                  Drag a book from here onto any shelf.
                </span>
              </div>

              {/* Add Books + Random books stacked on the right */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                  alignItems: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={openSearchOverlay}
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      "linear-gradient(to right, #3b82f6, #6366f1)",
                    color: "#f9fafb",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.45)",
                  }}
                >
                  Add Books
                </button>

                <button
                  type="button"
                  onClick={handleRandomTrayFill}
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "999px",
                    border: `1px solid ${theme.shelfBorder}`,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    color: "#f9fafb",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Random books
                </button>
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={moveItemToTray}
              style={{
                flex: 1,
                minHeight: "5.4rem",
                borderRadius: "0.5rem",
                border: `1px dashed ${theme.shelfBorder}`,
                background: theme.shelfBackground,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                padding: "0.6rem 0.6rem 0.5rem",
                gap: "0.35rem",
                overflow: "hidden",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.45)",
              }}
            >
              {loading ? (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#e5e7eb",
                    fontStyle: "italic",
                  }}
                >
                  Loading books...
                </div>
              ) : trayBooks.length === 0 ? (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#e5e7eb",
                    fontStyle: "italic",
                  }}
                >
                  No books in the tray. Drag from shelves to put them
                  back.
                </div>
              ) : null}

              {trayBooks.map((book) => (
                <div
                  key={book.id}
                  style={{
                    position: "relative",
                    paddingRight: "0.3rem",
                  }}
                >
                  <BookSpine
                    book={book}
                    draggingItemId={draggingItemId}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteItemFromTray(book.id)}
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

            {errorMsg ? (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#fecaca",
                  margin: 0,
                  marginTop: "0.4rem",
                }}
              >
                {errorMsg}
              </p>
            ) : (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#e5e7eb",
                  margin: 0,
                  marginTop: "0.4rem",
                }}
              >
                Refresh the page and your books and decor stay exactly
                where you left them.
              </p>
            )}
          </section>
        </div>

        {/* DECOR TRAY – FULL WIDTH BELOW SHELVES */}
        <section
          style={{
            borderRadius: "1rem",
            border: `1px solid ${theme.shelfBorder}`,
            background: theme.bookcaseBackground,
            padding: "0.75rem 1rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {/* header row: title + show/hide palette */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
                Decor tray
              </h3>

              <button
                type="button"
                onClick={() => setShowDecorPalette((v) => !v)}
                style={{
                  borderRadius: "999px",
                  border: `1px solid ${theme.shelfBorder}`,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "#e5e7eb",
                  fontSize: "0.75rem",
                  padding: "0.1rem 0.7rem",
                  cursor: "pointer",
                }}
              >
                {showDecorPalette ? "Hide options" : "Show options"}
              </button>
            </div>

            {/* Palette row (plants + candles, both collapsible) */}
            {showDecorPalette && (
              <div
                style={{
                  display: "flex",
                  gap: "0.3rem",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                {/* PLANT PALETTE – COLLAPSIBLE */}
                {!showPlantOptions ? (
                  <button
                    type="button"
                    onClick={() => setShowPlantOptions(true)}
                    style={{
                      borderRadius: "999px",
                      border: `1px solid ${theme.shelfBorder}`,
                      backgroundColor: "rgba(15,23,42,0.9)",
                      color: "#e5e7eb",
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.8rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Plants
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleAddDecor("plant", n)}
                        style={{
                          width: "2.4rem",
                          height: "2.8rem",
                          borderRadius: "0.6rem",
                          border:
                            "1px solid rgba(148,163,184,0.6)",
                          backgroundColor: "rgba(15,23,42,0.7)",
                          padding: "0.15rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={`Add plant ${n}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/decor/plant-${n}.png`}
                          alt={`Plant ${n}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowPlantOptions(false)}
                      style={{
                        borderRadius: "999px",
                        border: `1px solid ${theme.shelfBorder}`,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: "#e5e7eb",
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.7rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Hide
                    </button>
                  </div>
                )}

                {/* CANDLE PALETTE – COLLAPSIBLE */}
                {!showCandleOptions ? (
                  <button
                    type="button"
                    onClick={() => setShowCandleOptions(true)}
                    style={{
                      borderRadius: "999px",
                      border: `1px solid ${theme.shelfBorder}`,
                      backgroundColor: "rgba(250,204,21,0.2)",
                      color: "#fef9c3",
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.8rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Candles
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={`candle${n}`}
                        type="button"
                        onClick={() => handleAddDecor("candle", n)}
                        style={{
                          width: "2.4rem",
                          height: "2.8rem",
                          borderRadius: "0.6rem",
                          border:
                            "1px solid rgba(148,163,184,0.6)",
                          backgroundColor: "rgba(250,204,21,0.15)",
                          padding: "0.15rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={`Add candle ${n}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/decor/candle-${n}.png`}
                          alt={`Candle ${n}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowCandleOptions(false)}
                      style={{
                        borderRadius: "999px",
                        border: `1px solid ${theme.shelfBorder}`,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: "#e5e7eb",
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.7rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Hide
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actual decor items you’ve added */}
          {showDecorTray && (
            <div
              onDragOver={handleDragOver}
              onDrop={moveItemToTray}
              style={{
                minHeight: "6.5rem",
                borderRadius: "0.75rem",
                border: `1px dashed ${theme.shelfBorder}`,
                background: theme.shelfBackground,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                padding: "0.6rem",
                gap: "0.4rem",
                overflow: "hidden",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.45)",
              }}
            >
              {trayDecor.length === 0 ? (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#e5e7eb",
                    fontStyle: "italic",
                  }}
                >
                  Add plants and candles, then drag them onto your
                  shelves.
                </span>
              ) : null}

              {trayDecor.map((decor) => (
                <div
                  key={decor.id}
                  style={{
                    position: "relative",
                    paddingRight: "0.2rem",
                  }}
                >
                  <DecorItem
                    decor={decor}
                    draggingItemId={draggingItemId}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteItemFromTray(decor.id)}
                    title="Remove decor"
                    style={{
                      position: "absolute",
                      top: "-0.35rem",
                      right: "-0.05rem",
                      width: "0.9rem",
                      height: "0.9rem",
                      borderRadius: "999px",
                      border: "none",
                      backgroundColor: "rgba(15,23,42,0.9)",
                      color: "#e5e5e5",
                      fontSize: "0.65rem",
                      lineHeight: 1,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

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
                  Search by title, author, or ISBN. Click “Add to tray”
                  to drop the book into your shelf tray.
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
