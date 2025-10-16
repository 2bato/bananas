"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { motion, useAnimation } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Home() {
  const [name, setName] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Load name once per session
  useEffect(() => {
    const saved = sessionStorage.getItem("banana:name");
    if (saved) setName(saved);
    else setShowModal(true);
  }, []);

  const userId = useMemo(() => name.trim().toLowerCase() || "anonymous", [name]);

  // Data fetching
  const { data: stats, mutate: mutateStats } = useSWR(
    name ? `/api/stats?userId=${encodeURIComponent(userId)}` : null,
    fetcher
  );
  const { data: lb, mutate: mutateLb } = useSWR(`/api/leaderboard`, fetcher, {
    refreshInterval: 3000,
  });

  // Animations
  const bananaControls = useAnimation();
  const counterControls = useAnimation();

  const handleSaveName = () => {
    if (!name.trim()) return;
    sessionStorage.setItem("banana:name", name.trim());
    setShowModal(false);
  };

  const handleEatBanana = async () => {
    // Optimistic UI update
    mutateStats(
      (prev: any) => ({
        total: (prev?.total ?? 0) + 1,
        userTotal: (prev?.userTotal ?? 0) + 1,
      }),
      false
    );

    // 🍌 Bounce animation
    bananaControls.start({
      scale: [1, 1.2, 0.9, 1.1, 1],
      y: [0, -20, 5, -10, 0],
      transition: { duration: 0.5, ease: "easeOut" },
    });

    // Counter pulse animation
    counterControls.start({
      scale: [1, 1.4, 0.9, 1.1, 1],
      transition: { duration: 0.6, ease: "easeOut" },
    });

    // Persist to backend
    const res = await fetch("/api/incr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: 1 }),
    });

    if (!res.ok) {
      mutateStats(); // revert optimistic update
      alert("Failed to record banana. Try again.");
      return;
    }

    // Revalidate data
    mutateStats();
    mutateLb();
  };

  return (
    <main className="min-h-screen bg-yellow-50 text-neutral-900 flex flex-col items-center overflow-x-hidden">
      {/* Name modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-10">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-center">Enter your name</h2>
            <input
              className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-400"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              onClick={handleSaveName}
              className="rounded-md bg-yellow-400 hover:bg-yellow-500 py-2 font-medium transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Hero section */}
      <section className="flex flex-col items-center justify-center h-[100vh] w-full">
        <motion.div
          onClick={handleEatBanana}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={bananaControls} // 👈 attach animation controls
          className="text-[10rem] select-none cursor-pointer"
        >
          🍌
        </motion.div>

        <motion.p
          animate={counterControls}
          className="mt-4 text-7xl font-extrabold text-yellow-500 select-none"
        >
          {stats?.userTotal ?? 0}
        </motion.p>
      </section>

      {/* Spacer */}
      <div className="h-[35vh]" />

      {/* Leaderboard */}
      <section className="w-full max-w-md px-6 py-20 bg-white rounded-t-3xl shadow-inner">
        <h2 className="text-xl font-semibold text-center mb-4 text-yellow-600">
          Leaderboard
        </h2>
        <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-200">
          {(lb?.rows ?? []).length > 0 ? (
            lb.rows.map((row: any, i: number) => (
              <div
                key={row.userId + i}
                className="flex justify-between px-4 py-2 text-sm"
              >
                <span>
                  {i + 1}. {row.userId}
                </span>
                <span className="tabular-nums text-neutral-600">{row.score}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-neutral-400 py-6 text-sm">
              No bananas eaten yet
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
