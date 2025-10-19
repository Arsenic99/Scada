"use client";

import Link from "next/link";
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
      <nav className="flex justify-center items-center gap-5">
        <Link href="/plc1" className="border-1 rounded-md py-1 px-2">PLC1</Link>
        <Link href="/plc2" className="border-1 rounded-md py-1 px-2">PLC2</Link>
        <Link href="/plc3" className="border-1 rounded-md py-1 px-2">PLC3</Link>
        <Link href="/plc7" className="border-1 rounded-md py-1 px-2">PLC7</Link>
      </nav>
    </main>
  );
}
