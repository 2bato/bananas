"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

export default function Home() {
  const [name, setName] = useState("");
  const [bananas, setBananas] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ name: string; count: number }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const bananaControls = useAnimation();
  const counterControls = useAnimation();

  useEffect(() => {
    const savedName = sessionStorage.getItem("banana:name");
    const savedCount = Number(sessionStorage.getItem("banana:count") || 0);
    if (savedName) setName(savedName);
    else setShowModal(true);
    setBananas(savedCount);
  }, []);

  const handleSaveName = () => {
    if (!name.trim()) return;
    sessionStorage.setItem("banana:name", name.trim());
    setShowModal(false);
  };

  const handleEatBanana = async () => {
    const newCount = bananas + 1;
    setBananas(newCount);
    sessionStorage.setItem("banana:count", String(newCount));

    // Banana bounce animation
    bananaControls.start({
      scale: [1, 1.2, 0.9, 1.1, 1],
      y: [0, -20, 5, -10, 0],
      transition: { duration: 0.5, ease: "easeOut" },
    });

    // Counter bounce
    counterControls.start({
      scale: [1, 1.4, 0.9, 1.1, 1],
      transition: { duration: 0.6, ease: "easeOut" },
    });

    // Update leaderboard
    setLeaderboard((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((p) => p.name === name);
      if (idx >= 0) updated[idx].count = newCount;
      else updated.push({ name, count: newCount });
      return updated.sort((a, b) => b.count - a.count);
    });
  };

  return (
    <main className="min-h-screen bg-yellow-50 text-neutral-900 flex flex-col items-center overflow-x-hidden">
      {/* name modal */}
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

      {/* hero */}
      <section className="flex flex-col items-center justify-center h-[100vh] w-full">
        <motion.div
          onClick={handleEatBanana}
          animate={bananaControls}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-[10rem] select-none cursor-pointer"
        >
          🍌
        </motion.div>

        <motion.p
          animate={counterControls}
          className="mt-4 text-7xl font-extrabold text-yellow-500 select-none"
        >
          {bananas}
        </motion.p>
      </section>

      {/* spacer */}
      <div className="h-[35vh]" />

      {/* leaderboard */}
      <section className="w-full max-w-md px-6 py-20 bg-white rounded-t-3xl shadow-inner">
        <h2 className="text-xl font-semibold text-center mb-4 text-yellow-600">Leaderboard</h2>
        <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-200">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry, i) => (
              <div key={entry.name} className="flex justify-between px-4 py-2 text-sm">
                <span>{i + 1}. {entry.name}</span>
                <span className="tabular-nums text-neutral-600">{entry.count}</span>
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
