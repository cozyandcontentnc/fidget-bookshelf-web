// src/app/page.js
export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#18181b",
        color: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
            Drag and arrange your books on a cozy virtual shelf. (Placeholder UI)
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
          >
            Add books
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
          >
            Customize room
          </button>
        </div>
      </header>

      {/* Main content area */}
      <section
        style={{
          flex: 1,
          display: "flex",
          padding: "1.5rem 2rem",
          gap: "1.5rem",
        }}
      >
        {/* Left: “Room” */}
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
            {/* Three shelves */}
            {[0, 1, 2].map((shelfIndex) => (
              <div
                key={shelfIndex}
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
                {/* Placeholder “books” */}
                {[0, 1, 2, 3].map((bookIndex) => (
                  <div
                    key={bookIndex}
                    style={{
                      width: "2.2rem",
                      height: `${2 + bookIndex * 0.4}rem`,
                      borderRadius: "0.15rem",
                      backgroundColor:
                        ["#f97316", "#22c55e", "#6366f1", "#e11d48"][
                          (shelfIndex + bookIndex) % 4
                        ],
                      boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                    }}
                  />
                ))}
              </div>
            ))}
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
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>How this will work</h2>
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
            <li>Use Google Books search to add books into your “tray”.</li>
            <li>Drag books onto the shelves and they’ll snap into place.</li>
            <li>Customize the room background and bookcase style.</li>
            <li>Your layout is saved so your shelf stays how you left it.</li>
          </ol>
          <p style={{ fontSize: "0.8rem", color: "#71717a" }}>
            Right now this is just a static mockup. Next steps: add real drag-and-drop,
            then connect to Firebase and Google Books.
          </p>
        </aside>
      </section>
    </main>
  );
}
