import React, { useState, useEffect } from "react";

const STATUS_OPTIONS = ["Watching", "Completed", "Plan to Watch"];
const API_URL = "http://localhost:5000";

const ANIME_BG_URLS = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80",
    "https://cdn.pixabay.com/photo/2020/04/09/09/53/anime-5016840_1280.jpg",
    "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
];

// --- Profile icon and dropdown removed ---

export default function Watchlist({ navigate, userId }) {
    const [watchlist, setWatchlist] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [currentAnime, setCurrentAnime] = useState({ title: "", status: "Plan to Watch", rating: 0, id: null });

    // Pick a random background on mount
    useEffect(() => {
        const bg = ANIME_BG_URLS[Math.floor(Math.random() * ANIME_BG_URLS.length)];
        document.body.style.background = `linear-gradient(120deg, rgba(30,32,38,0.92) 0%, rgba(40,42,50,0.92) 100%), url('${bg}') center center / cover no-repeat fixed`;
        document.body.style.minHeight = "100vh";
        document.body.style.transition = "background 0.5s";
        return () => {
            document.body.style.background = "";
            document.body.style.minHeight = "";
            document.body.style.transition = "";
        };
    }, []);

    // Fetch watchlist from backend for the current user only
    useEffect(() => {
        if (!userId) return;
        fetch(`${API_URL}/watchlist/${userId}`)
            .then(async res => {
                if (!res.ok) throw new Error("Failed to fetch watchlist");
                try {
                    return await res.json();
                } catch {
                    throw new Error("Server did not return JSON. Check backend logs.");
                }
            })
            .then(data => {
                // Use the data as is, backend already filters by user
                setWatchlist(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                alert(err.message || "Failed to fetch watchlist.");
                setWatchlist([]);
            });
    }, [userId]);

    const openAddModal = () => {
        setModalMode("add");
        setCurrentAnime({ title: "", status: "Plan to Watch", rating: 0, id: null });
        setShowModal(true);
    };

    const openEditModal = (anime) => {
        setModalMode("edit");
        setCurrentAnime(anime);
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentAnime((prev) => ({
            ...prev,
            [name]: name === "rating" ? Number(value) : value,
        }));
    };

    // --- Anime Search State ---
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    // --- Anime Search Handler ---
    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchError("");
        setSearchResults([]);
        if (!searchTerm.trim()) {
            setSearchError("Enter a title to search.");
            return;
        }
        setSearchLoading(true);
        try {
            const res = await fetch(
                `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTerm)}&limit=8`
            );
            const data = await res.json();
            if (data && Array.isArray(data.data)) {
                setSearchResults(data.data);
                if (data.data.length === 0) setSearchError("No results found.");
            } else {
                setSearchError("No results found.");
            }
        } catch {
            setSearchError("Failed to search. Try again.");
        }
        setSearchLoading(false);
    };

    // --- Add from Search Result ---
    const handleAddFromSearch = (anime) => {
        setModalMode("add");
        setCurrentAnime({
            title: anime.title_english || anime.title,
            status: "Plan to Watch",
            rating: 0,
            id: null,
        });
        setShowModal(true);
    };

    // --- Add or Edit anime (CRUD with backend) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentAnime.title.trim()) {
            alert("Please enter a valid anime title. Only verified anime series can be added to your watchlist.\nMake sure the title matches an official anime name.");
            return;
        }
        if (!userId || isNaN(Number(userId))) {
            alert("User ID is missing. Please log in again.");
            return;
        }
        if (!currentAnime.status) {
            alert("Status is required.");
            return;
        }

        // Prevent duplicate titles for the same user
        if (
            modalMode === "add" &&
            watchlist.some(
                (a) =>
                    a.title.toLowerCase() === currentAnime.title.trim().toLowerCase()
            )
        ) {
            alert("This anime is already in your watchlist.");
            return;
        }

        // Only verify if user typed title manually (not from search)
        if (
            modalMode === "add" &&
            !searchResults.some(
                (a) =>
                    (a.title && a.title.toLowerCase() === currentAnime.title.trim().toLowerCase()) ||
                    (a.title_english &&
                        a.title_english.toLowerCase() === currentAnime.title.trim().toLowerCase())
            )
        ) {
            let verified = false;
            try {
                const jikanRes = await fetch(
                    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(currentAnime.title)}&limit=1`
                );
                const jikanData = await jikanRes.json();
                if (
                    jikanData &&
                    Array.isArray(jikanData.data) &&
                    jikanData.data.length > 0 &&
                    jikanData.data[0].title
                ) {
                    const foundTitle = jikanData.data[0].title.toLowerCase();
                    if (
                        foundTitle === currentAnime.title.trim().toLowerCase() ||
                        (jikanData.data[0].title_english &&
                            jikanData.data[0].title_english.toLowerCase() === currentAnime.title.trim().toLowerCase())
                    ) {
                        verified = true;
                    } else if (
                        foundTitle.includes(currentAnime.title.trim().toLowerCase()) ||
                        (jikanData.data[0].title_english &&
                            jikanData.data[0].title_english
                                .toLowerCase()
                                .includes(currentAnime.title.trim().toLowerCase()))
                    ) {
                        verified = true;
                    }
                }
            } catch {
                alert("Could not verify anime title. Please check your internet connection or try again later.");
                return;
            }
            if (!verified) {
                alert("Anime not found. Please enter a valid anime title from MyAnimeList.");
                return;
            }
        }

        if (modalMode === "add") {
            let newAnime;
            try {
                const res = await fetch(`${API_URL}/watchlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: Number(userId),
                        title: currentAnime.title,
                        status: currentAnime.status,
                        rating: currentAnime.rating
                    })
                });
                try {
                    newAnime = await res.json();
                } catch (e) {
                    alert("Server did not return JSON. Check backend logs.");
                    return;
                }
                if (!res.ok) {
                    alert(newAnime.message || "Failed to add anime.");
                    return;
                }
                setWatchlist([...watchlist, newAnime]);
            } catch (err) {
                alert("Server error. Please try again.");
            }
        } else {
            let updatedAnime;
            try {
                const res = await fetch(`${API_URL}/watchlist/${currentAnime.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: currentAnime.title,
                        status: currentAnime.status,
                        rating: currentAnime.rating
                    })
                });
                try {
                    updatedAnime = await res.json();
                } catch (e) {
                    alert("Server did not return JSON. Check backend logs.");
                    return;
                }
                if (!res.ok) {
                    alert(updatedAnime.message || "Failed to update anime.");
                    return;
                }
                setWatchlist(
                    watchlist.map((a) =>
                        a.id === updatedAnime.id ? updatedAnime : a
                    )
                );
            } catch (err) {
                alert("Server error. Please try again.");
            }
        }
        setShowModal(false);
    };

    // Delete anime (CRUD with backend)
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this anime from your watchlist?\nThis action cannot be undone."
        );
        if (!confirmDelete) return;
        try {
            const res = await fetch(`${API_URL}/watchlist/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                let error = {};
                try {
                    error = await res.json();
                } catch {
                    alert("Server did not return JSON. Check backend logs.");
                    return;
                }
                alert(error.message || "Failed to delete anime.");
                return;
            }
            setWatchlist(watchlist.filter((a) => a.id !== id));
        } catch (err) {
            alert("Server error. Please try again.");
        }
    };

    return (
        <div style={styles.bgOverlay}>
            <div style={styles.container}>
                <div style={styles.headerRow}>
                    <h2 style={styles.title}>Your Watchlist</h2>
                    <button style={styles.addBtn} onClick={openAddModal}>+ Add Anime</button>
                </div>

                {/* --- Anime Search Section --- */}
                <form onSubmit={handleSearch} style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                        type="text"
                        placeholder="Search for anime title..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ ...styles.input, width: "260px" }}
                    />
                    <button
                        style={{ ...styles.saveBtn, padding: "0.6rem 1.2rem" }}
                        type="submit"
                        disabled={searchLoading}
                    >
                        {searchLoading ? "Searching..." : "Search"}
                    </button>
                </form>
                {searchError && (
                    <div style={{ color: "#ff6f61", marginBottom: "1rem", fontSize: "1rem" }}>
                        {searchError}
                    </div>
                )}
                {searchResults.length > 0 && (
                    <div style={{ marginBottom: "1.5rem", background: "#23252b", borderRadius: "8px", padding: "1rem" }}>
                        <div style={{ color: "#ffb347", fontWeight: "bold", marginBottom: "0.5rem" }}>Search Results:</div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {searchResults.map(anime => (
                                <li key={anime.mal_id} style={{ marginBottom: "0.7rem", display: "flex", alignItems: "center" }}>
                                    <img src={anime.images.jpg.image_url} alt={anime.title} style={{ width: 38, height: 54, objectFit: "cover", borderRadius: 4, marginRight: 12 }} />
                                    <span style={{ color: "#fff", fontWeight: 500, marginRight: 10 }}>{anime.title_english || anime.title}</span>
                                    <button
                                        style={{ ...styles.saveBtn, padding: "0.3rem 1rem", fontSize: "0.95rem" }}
                                        onClick={() => handleAddFromSearch(anime)}
                                    >
                                        Add
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* --- End Anime Search Section --- */}

                {watchlist.length === 0 ? (
                    <div style={styles.empty}>No anime in your watchlist yet.</div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Title</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Rating</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map((anime) => (
                                <tr key={anime.id} style={styles.tr}>
                                    <td style={styles.td}>{anime.title}</td>
                                    <td style={styles.td}>{anime.status}</td>
                                    <td style={styles.td}>{anime.rating}</td>
                                    <td style={styles.td}>
                                        <button style={styles.editBtn} onClick={() => openEditModal(anime)}>Edit</button>
                                        <button style={styles.deleteBtn} onClick={() => handleDelete(anime.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {showModal && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modal}>
                            <h3 style={{ color: "#ffb347", marginBottom: "1rem" }}>
                                {modalMode === "add" ? "Add Anime" : "Edit Anime"}
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <div style={styles.formGroup}>
                                    <label>Title:</label>
                                    <input
                                        name="title"
                                        type="text"
                                        value={currentAnime.title}
                                        onChange={handleChange}
                                        required
                                        style={styles.input}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label>Status:</label>
                                    <select
                                        name="status"
                                        value={currentAnime.status}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option key={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label>Rating:</label>
                                    <input
                                        name="rating"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={currentAnime.rating}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                    <button type="submit" style={styles.saveBtn}>
                                        {modalMode === "add" ? "Add" : "Save"}
                                    </button>
                                    <button
                                        type="button"
                                        style={styles.cancelBtn}
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    bgOverlay: {
        minHeight: "100vh",
        width: "100vw",
        background: "rgba(30,32,38,0.7)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 0",
        position: "relative",
    },
    logoutContainer: {
        position: "fixed",
        top: "24px",
        right: "36px",
        zIndex: 1100,
    },
    logoutBtn: {
        background: "none",
        color: "#ffb347",
        border: "1.5px solid #ffb347",
        borderRadius: "50px",
        padding: "0.45rem 1.2rem",
        fontWeight: "bold",
        fontSize: "1rem",
        cursor: "pointer",
        boxShadow: "0 2px 8px #0001",
        transition: "background 0.2s, color 0.2s, border 0.2s",
        outline: "none",
    },
    container: {
        background: "rgba(40,42,50,0.93)",
        borderRadius: "20px",
        padding: "2.5rem",
        maxWidth: "700px",
        width: "95vw",
        margin: "2rem auto",
        boxShadow: "0 8px 32px 0 rgba(20,22,30,0.45)",
        border: "1px solid rgba(255,255,255,0.10)",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
    },
    title: {
        color: "#ffb347",
        fontWeight: "bold",
        fontSize: "2rem",
        margin: 0,
        letterSpacing: "1px",
        textShadow: "0 2px 8px #0008",
    },
    addBtn: {
        background: "linear-gradient(90deg, #ffb347 60%, #ffcc80 100%)",
        color: "#23252b",
        border: "none",
        borderRadius: "8px",
        padding: "0.6rem 1.7rem",
        fontWeight: "bold",
        fontSize: "1.1rem",
        cursor: "pointer",
        boxShadow: "0 2px 8px #0002",
        transition: "background 0.2s",
    },
    empty: {
        color: "#fff",
        textAlign: "center",
        padding: "2rem 0",
        fontSize: "1.2rem",
        opacity: 0.85,
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        background: "rgba(40,42,50,0.98)",
        borderRadius: "12px",
        color: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
    },
    th: {
        padding: "0.85rem",
        color: "#ffb347",
        fontWeight: "bold",
        borderBottom: "1px solid #444",
        fontSize: "1.05rem",
        background: "rgba(40,42,50,0.98)",
    },
    tr: {
        borderBottom: "1px solid #333",
    },
    td: {
        padding: "0.85rem",
        textAlign: "center",
        fontSize: "1.05rem",
    },
    editBtn: {
        background: "#7ec4cf",
        color: "#23252b",
        border: "none",
        borderRadius: "6px",
        padding: "0.35rem 1rem",
        marginRight: "0.5rem",
        cursor: "pointer",
        fontWeight: "bold",
        boxShadow: "0 1px 4px #0002",
    },
    deleteBtn: {
        background: "#ff6f61",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "0.35rem 1rem",
        cursor: "pointer",
        fontWeight: "bold",
        boxShadow: "0 1px 4px #0002",
    },
    modalOverlay: {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(20,22,30,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        background: "rgba(40,42,50,0.98)",
        padding: "2rem",
        borderRadius: "16px",
        minWidth: "320px",
        color: "#fff",
        boxShadow: "0 4px 32px rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.10)",
    },
    formGroup: {
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
    },
    input: {
        marginTop: "0.3rem",
        padding: "0.6rem",
        borderRadius: "6px",
        border: "1px solid #444",
        background: "#23252b",
        color: "#fff",
        fontSize: "1rem",
        width: "100%",
        outline: "none",
        boxShadow: "0 1px 4px #0001",
    },
    saveBtn: {
        background: "linear-gradient(90deg, #ffb347 60%, #ffcc80 100%)",
        color: "#23252b",
        border: "none",
        borderRadius: "6px",
        padding: "0.6rem 1.5rem",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "1rem",
        boxShadow: "0 2px 8px #0002",
    },
    cancelBtn: {
        background: "none",
        color: "#fff",
        border: "1.5px solid #fff",
        borderRadius: "6px",
        padding: "0.6rem 1.5rem",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "1rem",
        boxShadow: "0 2px 8px #0002",
    },
};