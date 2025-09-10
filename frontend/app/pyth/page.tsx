"use client";

import React, { useState } from "react";

export default function PythPage() {
  const [status, setStatus] = useState<string>("idle");
  const [feed, setFeed] = useState<any>(null);

  async function fetchFeeds() {
    setStatus("loading");
    try {
      // Placeholder: replace this with the real Pyth fetch (on-chain RPC or your backend)
      const res = await fetch("/api/pyth/feeds");
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setFeed(data);
      setStatus("loaded");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Pyth feeds (placeholder)</h1>
      <p>
        This page will display feed data fetched from the Pyth oracle. Click the
        button below to run a placeholder request (you can implement the
        backend or direct Pyth client later).
      </p>

      <div style={{ marginTop: 12 }}>
        <button onClick={fetchFeeds} disabled={status === "loading"}>
          {status === "loading" ? "Fetching..." : "Fetch Pyth feeds"}
        </button>
        <span style={{ marginLeft: 12 }}>Status: {status}</span>
      </div>

      {feed && (
        <section style={{ marginTop: 18 }}>
          <h2>Result</h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f6f8fa", padding: 12 }}>
            {JSON.stringify(feed, null, 2)}
          </pre>
        </section>
      )}

      <section style={{ marginTop: 18 }}>
        <h3>Next steps</h3>
        <ul>
          <li>Create an API route (e.g. <code>/api/pyth/feeds</code>) that queries Pyth.
          </li>
          <li>Or add a browser-side Pyth client if you want direct on-chain reads.</li>
          <li>Store RPC keys in <code>.env.local</code> and never commit them.</li>
        </ul>
      </section>
    </main>
  );
}
