import React from "react";
import { useNavigate } from "react-router-dom";

// Navbar styles
const navStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2.5rem",
    background: "#181a20",
    color: "#e0e0e0",
    fontSize: "1.15rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    minHeight: "70px",
};

const navLinksStyle = {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
    fontSize: "1.08rem",
};

const linkStyle = {
    color: "#fff",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "1.08rem",
    transition: "color 0.2s",
    position: "relative",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
};

const homeContainer = {
    minHeight: "calc(100vh - 70px)",
    background: "#181a20",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
};

const titleStyle = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#ff9800",
    marginBottom: "1rem",
};

const descStyle = {
    fontSize: "1.2rem",
    color: "#e0e0e0",
    maxWidth: "600px",
    textAlign: "center",
    marginBottom: "2rem",
};

// check login status in order access to watchlist
function isLoggedIn() {
    return localStorage.getItem("isLoggedIn") === "true";
}

// Simple logout icon (SVG)
function LogoutIcon({ size = 22, color = "#ffb347" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M16 17L21 12L16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19C7.58 19 4 15.42 4 11C4 6.58 7.58 3 12 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

// Profile icon SVG
function ProfileIcon({ size = 22, color = "#ffb347" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth="2" />
        </svg>
    );
}

function Navbar() {
    const [hovered, setHovered] = React.useState(null);
    const navigate = useNavigate();
    const loggedIn = isLoggedIn();

    const navItems = [
        { text: "Home", href: "/" },
        { text: "Watchlist", href: "/main" }
    ];

    const getLinkStyle = (idx) => ({
        ...linkStyle,
        color: hovered === idx ? "#ff9800" : "#fff",
        background: hovered === idx ? "rgba(255,152,0,0.08)" : "transparent",
        fontSize: "1.08rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    });

    const handleNavClick = (e, item) => {
        e.preventDefault();
        if (item.text === "Watchlist") {
            if (loggedIn) {
                navigate("/main");
            } else {
                navigate("/auth");
            }
        } else if (item.text === "Home") {
            navigate("/");
        }
    };

    const handleLogout = () => {
    if (window.confirm("Are you really sure you want to logout?")) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userEmail");
        navigate("/");
        window.location.reload();
    }
};


    return (
        <nav style={navStyle}>
            <div style={{ fontWeight: "bold", fontSize: "1.6rem", color: "#ff9800", letterSpacing: "1px" }}>
                Anime Watchlist
            </div>
            <div style={navLinksStyle}>
                {navItems.map((item, idx) => (
                    <a
                        key={item.text}
                        href={item.href}
                        style={getLinkStyle(idx)}
                        onMouseEnter={() => setHovered(idx)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={(e) => handleNavClick(e, item)}
                    >
                        {item.text}
                    </a>
                ))}
                {/* Show Logout button only if logged in */}
                                {!loggedIn && (
                    <button
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ffb347",
                            borderRadius: "50%",
                            padding: "0.35rem",
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            cursor: "pointer",
                            marginLeft: "1.2rem",
                            display: "flex",
                            alignItems: "center",
                            transition: "background 0.15s",
                        }}
                        title="Profile"
                        onClick={() => navigate("/auth")}
                    >
                        <ProfileIcon />
                    </button>
                )}
                {loggedIn && (
                    <button
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ffb347",
                            borderRadius: "50%",
                            padding: "0.35rem",
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            cursor: "pointer",
                            marginLeft: "1.2rem",
                            display: "flex",
                            alignItems: "center",
                            transition: "background 0.15s",
                        }}
                        title="Logout"
                        onClick={handleLogout}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,152,0,0.13)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                        <LogoutIcon />
                    </button>
                )}
            </div>
        </nav>
    );
}

function AnimeList() {
    const [animes, setAnimes] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [hovered, setHovered] = React.useState(null);
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);

    React.useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`https://api.jikan.moe/v4/anime?page=${page}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch anime");
                return res.json();
            })
            .then((data) => {
                setAnimes((prev) => [...prev, ...(data.data || [])]);
                setHasMore(data.pagination?.has_next_page ?? false);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [page]);

    const handleLoadMore = () => {
        if (hasMore && !loading) setPage((p) => p + 1);
    };

    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center", marginTop: "2rem" }}>
                {animes.map((anime) => (
                    <div
                        key={anime.mal_id}
                        style={{
                            background: "#23252b",
                            borderRadius: "8px",
                            width: "180px",
                            padding: "1rem",
                            textAlign: "center",
                            position: "relative",
                            boxShadow: hovered === anime.mal_id ? "0 0 0 2px #ff9800" : "none",
                            transition: "box-shadow 0.2s"
                        }}
                        onMouseEnter={() => setHovered(anime.mal_id)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <img src={anime.images.jpg.image_url} alt={anime.title} style={{ width: "100%", borderRadius: "6px" }} />
                        <div style={{ color: "#ff9800", fontWeight: "bold", margin: "0.5rem 0" }}>{anime.title}</div>
                        <div style={{ color: "#e0e0e0", fontSize: "0.9rem" }}>Score: {anime.score ?? "N/A"}</div>
                    </div>
                ))}
            </div>
            {loading && <div style={{ color: "#e0e0e0", margin: "1rem" }}>Loading anime list...</div>}
            {hasMore && !loading && (
                <button
                    style={{
                        margin: "2rem 0",
                        padding: "0.75rem 2rem",
                        background: "#ff9800",
                        color: "#181a20",
                        border: "none",
                        borderRadius: "5px",
                        fontSize: "1rem",
                        cursor: "pointer",
                        fontWeight: "bold",
                        transition: "background 0.2s, color 0.2s"
                    }}
                    onClick={handleLoadMore}
                >
                    Load More
                </button>
            )}
        </div>
    );
}

function HomeView() {
    return (
        <>
            <Navbar />
            <div style={homeContainer}>
                <h1 style={titleStyle}>Welcome to Anime Watchlist</h1>
                <p style={descStyle}>
                    Discover, track, and manage your favorite anime series all in one place. Start building your personalized watchlist and never miss an episode!
                </p>
                <AnimeList />
            </div>
        </>
    );
}

export default HomeView;