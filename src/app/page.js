"use client";

import { useState } from "react";

const INITIAL_BOOKS = [
  { id: "b1", label: "Book 1", color: "#f97316", shelfIndex: null },
  { id: "b2", label: "Book 2", color: "#22c55e", shelfIndex: null },
  { id: "b3", label: "Book 3", color: "#6366f1", shelfIndex: null },
  { id: "b4", label: "Book 4", color: "#e11d48", shelfIndex: null },
  { id: "b5", label: "Book 5", color: "#a855f7", shelfIndex: null },
];

const SHELVES = [0, 1, 2];

export default function HomePage() {
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [draggingBookId, setDraggingBookId] = useState(null);

  const trayBooks = books.filter((b) => b.shelfIndex === null);

  const getBooksOnShelf = (shelfIndex) =>
    books.filter((b) => b.shelfIndex === shelfIndex);

  function handleDragStart(bookId) {
    setDraggingBookId(bookId);
  }

  function handleDragEnd() {
    setDraggingBookId(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function moveBookToTray() {
    if (!draggingBookId) return;
    setBooks((prev) =>
      prev.map((b) =>
        b.id === draggingBookId ? { ...b, shelfIndex: null } : b
      )
    );
    setDraggingBookId(null);
  }

  function moveBookToShelf(targetShelfIndex) {
    if (!draggingBookId) return;
    setBooks((prev) =>
      prev.map((b) =>
        b.id === draggingBookId ? { ...b, shelfIndex: targetShelfIndex } : b
      )
    );
    setDraggingBookId(null);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#18181b",
        color: "#f5f5f5",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid #27272a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Fidget Bookshelf</h1>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#a1a1aa" }}>
            Drag books between your tray and shelves. (In-memory demo)
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            style={{
              padding: "0.4rem 0.8rem",
              backgroundColor: "#3b82f6",
              border: "none",
              borderRadius: "999px",
              color: "#f9fafb",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
            type="button"
          >
            Add books (coming later)
          </button>
          <button
            style={{
              padding: "0.4rem 0.8rem",
              backgroundColor: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: "999px",
              color: "#e4e4e7",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
            type="button"
          >
            Customize room (coming later)
          </button>
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
              borderRadius: "1rem",
              padding: "1rem",
              background:
                "radial-gradient(circle at top left, #27272f, #020617)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Fake background wall */}
            <div
              style={{
                position: "absolute",
                inset: "0",
                opacity: 0.15,
                backgroundImage:
                  "linear-gradient(135deg, rgba(148,163,184,0.3) 0, transparent 40%)",
                pointerEvents: "none",
              }}
            />

            {/* Bookcase box */}
            <div
              style={{
                position: "relative",
                margin: "auto",
                marginTop: "1rem",
                width: "80%",
                height: "70%",
                borderRadius: "0.75rem",
                border: "2px solid #1f2933",
                background:
                  "linear-gradient(to bottom, #111827, #020617)",
                boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                padding: "0.75rem",
                gap: "0.5rem",
              }}
            >
              {SHELVES.map((shelfIndex) => {
                const shelfBooks = getBooksOnShelf(shelfIndex);
                return (
                  <div
                    key={shelfIndex}
                    onDragOver={handleDragOver}
                    onDrop={() => moveBookToShelf(shelfIndex)}
                    style={{
                      flex: 1,
                      borderRadius: "0.25rem",
                      border: "1px solid #111827",
                      background:
                        "linear-gradient(to bottom, #0f172a, #020617)",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: "0.35rem",
                      gap: "0.25rem",
                      overflow: "hidden",
                    }}
                  >
                    {shelfBooks.length === 0 ? (
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#52525b",
                          fontStyle: "italic",
                        }}
                      >
                        Drop books here
                      </div>
                    ) : null}

                    {shelfBooks.map((book) => (
                      <div
                        key={book.id}
                        draggable
                        onDragStart={() => handleDragStart(book.id)}
                        onDragEnd={handleDragEnd}
                        style={{
                          width: "2.2rem",
                          height: "3.5rem",
                          borderRadius: "0.15rem",
                          backgroundColor: book.color,
                          boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          paddingBottom: "0.15rem",
                          fontSize: "0.55rem",
                          color: "#020617",
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                          cursor: "grab",
                          opacity:
                            draggingBookId === book.id ? 0.4 : 1,
                        }}
                      >
                        {book.label}
                      </div>
                    ))}
                  </div>
                );
              })}
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
              How this demo works
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
              <li>Books start in the tray at the bottom.</li>
              <li>
                Drag a book onto any shelf until you see the “drop” cursor,
                then release.
              </li>
              <li>
                To remove a book from a shelf, drag it back down into the
                tray.
              </li>
              <li>
                This version only stores everything in memory – refresh the
                page and it resets.
              </li>
            </ol>
            <p style={{ fontSize: "0.8rem", color: "#71717a" }}>
              Next phases: save layouts in Firebase, then pull real books
              from Google Books and add room customization.
            </p>
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
            }}
          >
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Book tray</h3>
            <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
              Drag a book from here onto any shelf.
            </span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={moveBookToTray}
            style={{
              minHeight: "4.5rem",
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
            {trayBooks.length === 0 ? (
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
                draggable
                onDragStart={() => handleDragStart(book.id)}
                onDragEnd={handleDragEnd}
                style={{
                  width: "2.2rem",
                  height: "3.5rem",
                  borderRadius: "0.15rem",
                  backgroundColor: book.color,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingBottom: "0.15rem",
                  fontSize: "0.55rem",
                  color: "#020617",
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  cursor: "grab",
                  opacity: draggingBookId === book.id ? 0.4 : 1,
                }}
              >
                {book.label}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
