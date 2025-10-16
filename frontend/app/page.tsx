"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    // fetch к backend через Nginx прокси
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Error: " + err.message));
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Frontend</h1>
      <p>Message from backend: {message}</p>
    </main>
  );
}
