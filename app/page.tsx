"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import useSWR from "swr";
import { motion, useAnimation } from "framer-motion";

type Stats = { total: number; userTotal: number };
type LbRow = { userId: string; score: number };
type Leaderboard = { rows: LbRow[]; total: number };

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const nf = new Intl.NumberFormat();

export default function Home() {
  const [name, setName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load name once per session
  useEffect(() => {
    const saved = sessionStorage.getItem("banana:name");
    if (saved) setName(saved);
    else setShowModal(true);
  }, []);

  // Focus input when modal appears
  useEffect(() => {
    if (showModal) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [showModal]);

  const userId = useMemo(() => name.trim().toLowerCase() || "anonymous", [name]);

  // Data
  const { data: stats, mutate: mutateStats } = useSWR<Stats>(
    name ? `/api/stats?userId=${encodeURIComponent(userId)}` : null,
    fetcher
  );
  const { data: lb, mutate: mutateLb, isLoading: lbLoading } = useSWR<Leaderboard>(
    `/api/leaderboard`,
    fetcher,
    { refreshInterval: 3000 }
  );

  // Animations
  const bananaControls = useAnimation();
  const counterControls = useAnimation();

  const handleSaveName = () => {
    const cleaned = name.trim();
    if (!cleaned) return;
    sessionStorage.setItem("banana:name", cleaned);
    setName(cleaned);
    setShowModal(false);
  };

  const handleEatBanana = async () => {
    // Optimistic UI (typed)
    mutateStats(
      (prev) => ({
        total: (prev?.total ?? 0) + 1,
        userTotal: (prev?.userTotal ?? 0) + 1,
      }),
      false
    );

    // Bounce animation
    bananaControls.start({
      scale: [1, 1.2, 0.9, 1.1, 1],
      y: [0, -20, 5, -10, 0],
      transition: { duration: 0.5, ease: "easeOut" },
    });
    counterControls.start({
      scale: [1, 1.4, 0.9, 1.1, 1],
      transition: { duration: 0.6, ease: "easeOut" },
    });

    // Persist
    const res = await fetch("/api/incr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: 1 }),
    });

    if (!res.ok) {
      mutateStats();
      alert("Failed to record banana. Try again.");
      return;
    }

    mutateStats();
    mutateLb();
  };

  const topRows = (lb?.rows ?? []) as LbRow[];
  const totalBananas: number = lb?.total ?? stats?.total ?? 0;
  const isNameValid = name.trim().length > 0;

  return (
    <main className="min-h-screen bg-yellow-50 text-neutral-900 flex flex-col items-center overflow-x-hidden relative">
      {/* login modal — only shown once */}
      {showModal && (
        <div className="fixed inset-0 z-30 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-7 border border-neutral-200">
              <div className="text-center space-y-1.5 mb-4">
                <div className="text-3xl">🍌</div>
                <h2 className="text-xl font-semibold">Who are you?</h2>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-neutral-600">
                  Display name
                </label>
                <input
                  ref={inputRef}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isNameValid) handleSaveName();
                  }}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveName}
                    disabled={!isNameValid}
                    className={`px-4 py-2 text-sm rounded-md font-medium transition ${
                      isNameValid
                        ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                        : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* hero */}
      <section className="flex flex-col items-center justify-center h-[100vh] w-full">
        <motion.div
          onClick={handleEatBanana}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={bananaControls}
          className="text-[10rem] select-none cursor-pointer"
          aria-label="Eat a banana"
          role="button"
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

      {/* spacer */}
      <div className="h-[35vh]" />

      {/* leaderboard */}
      <section className="w-full max-w-md px-6 py-20 bg-white rounded-t-3xl shadow-inner">
        <h2 className="text-xl font-semibold text-center mb-2 text-yellow-400">
          Leaderboard
        </h2>

        {/* total bananas */}
        <div className="text-center mb-6">
          <p className="text-sm text-neutral-500 mb-2">Total bananas eaten</p>
          <p className="text-3xl font-bold text-yellow-500">
            {nf.format(totalBananas)}
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          {/* header row */}
          <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 text-neutral-600 text-xs">
            <span className="w-12 text-center tabular-nums">#</span>
            <span className="flex-1">User</span>
            <span className="tabular-nums">Score</span>
          </div>

          {/* rows */}
          <div className="divide-y divide-neutral-200">
            {lbLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="w-12 flex justify-center">
                    <div className="h-4 w-8 bg-neutral-100 rounded animate-pulse" />
                  </div>
                  <div className="flex-1 h-4 bg-neutral-100 rounded animate-pulse mx-3" />
                  <div className="h-4 w-10 bg-neutral-100 rounded animate-pulse" />
                </div>
              ))
            ) : topRows.length > 0 ? (
              topRows.map((row, i) => {
                const isYou = row.userId.toLowerCase() === userId;
                const medal =
                  i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

                return (
                  <div
                    key={row.userId + i}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      isYou ? "bg-yellow-50" : ""
                    }`}
                  >
                    {/* rank — consistent box fixes alignment */}
                    <span className="w-12 flex justify-center tabular-nums">
                      <span className="inline-flex items-center justify-center w-8 h-5 leading-none">
                        {medal ? (
                          <span className="block text-base leading-none translate-y-[1px]">
                            {medal}
                          </span>
                        ) : (
                          <span className="block text-sm leading-none">
                            {i + 1}
                          </span>
                        )}
                      </span>
                    </span>

                    {/* user name */}
                    <span
                      className={`flex-1 truncate ${
                        isYou ? "font-semibold" : ""
                      }`}
                    >
                      {isYou ? `${row.userId} (you)` : row.userId}
                    </span>

                    {/* score */}
                    <span className="tabular-nums text-neutral-700">
                      {nf.format(row.score)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-neutral-400 py-6 text-sm">
                No bananas eaten yet
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
