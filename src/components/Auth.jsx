import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ email: "", password: "" });
    const [emailValid, setEmailValid] = useState(true);
    const navigate = useNavigate();

    // Simple email validation
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (name === "email") {
            setEmailValid(isValidEmail(value) || value === "");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password) {
            alert("Please fill in all fields.");
            return;
        }

        if (!isValidEmail(form.email)) {
            setEmailValid(false);
            return;
        }

        const endpoint = isLogin
            ? `${API_URL}/users/login`
            : `${API_URL}/users/register`;

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            let data;
            try {
                data = await res.json();
            } catch (err) {
                alert("Server did not return JSON. Check backend logs.");
                return;
            }

            if (res.ok) {
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("userEmail", data.user?.email || form.email);
                localStorage.setItem("userId", data.user?.id || "");
                navigate("/");
            } else {
                alert(data.message || "Authentication failed");
            }
        } catch (err) {
            alert("Server error. Please try again.");
        }
    };

    return (
        <div style={styles.bg}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>{isLogin ? "Login" : "Sign Up"}</h2>
                <input
                    style={styles.input}
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                {!emailValid && (
                    <div style={{ color: "#ff6f61", marginBottom: "0.7rem", fontSize: "0.97rem" }}>
                        Please enter a valid email address.
                    </div>
                )}
                <input
                    style={styles.input}
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
                <button style={styles.button} type="submit">
                    {isLogin ? "Login" : "Sign Up"}
                </button>
                <p style={styles.toggleText}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <span
                        style={styles.toggleLink}
                        onClick={() => setIsLogin(!isLogin)}
                        tabIndex={0}
                        role="button"
                    >
                        {isLogin ? "Sign Up" : "Login"}
                    </span>
                </p>
            </form>
        </div>
    );
};

const styles = {
    bg: {
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(120deg, rgba(30,32,38,0.92) 0%, rgba(40,42,50,0.92) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    form: {
        background: "rgba(40,42,50,0.98)",
        borderRadius: "10px",
        boxShadow: "0 2px 12px 0 rgba(20,22,30,0.18)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "1.2rem 1.2rem",
        minWidth: "240px",
        maxWidth: "94vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    title: {
        marginBottom: "1rem",
        fontWeight: 700,
        fontSize: "1.25rem",
        textAlign: "center",
        color: "#ffb347",
        letterSpacing: "1px",
        textShadow: "0 2px 8px #0008",
    },
    input: {
        marginBottom: "0.8rem",
        padding: "0.6rem",
        border: "1px solid #444",
        borderRadius: "5px",
        fontSize: "1rem",
        outline: "none",
        background: "#23252b",
        color: "#fff",
        width: "100%",
        boxSizing: "border-box",
    },
    button: {
        padding: "0.6rem",
        background: "linear-gradient(90deg, #ffb347 60%, #ffcc80 100%)",
        color: "#23252b",
        border: "none",
        borderRadius: "5px",
        fontWeight: 700,
        cursor: "pointer",
        marginBottom: "0.8rem",
        fontSize: "1rem",
        width: "100%",
    },
    toggleText: {
        textAlign: "center",
        fontSize: "0.97rem",
        color: "#e0e0e0",
    },
    toggleLink: {
        color: "#ffb347",
        cursor: "pointer",
        textDecoration: "underline",
        marginLeft: "0.25rem",
        fontWeight: "bold",
    },
};

export default Auth;