import React, { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://server:5000/api/message")
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setError("Could not connect to server");
      });
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Day 2 — Docker Compose Multi-Container App</h1>
      <p><strong>Backend Response:</strong> {message}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default App;