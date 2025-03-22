"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import RockPaperScissors from "@/components/rock-paper-scissors"

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)
  const [startSound, setStartSound] = useState<HTMLAudioElement | null>(null)

  // Initialize audio after component mounts to avoid SSR issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      setStartSound(
        new Audio(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mouse-click-290204-pZaoKP8Mmt8bSOvRyAhfXzX6Z0XxJ3.mp3",
        ),
      )
    }
  }, [])

  const handleStartGame = () => {
    // Play sound first, then start game
    if (startSound) {
      startSound.currentTime = 0
      startSound.play().catch((err) => console.error("Error playing start sound:", err))
    }
    setGameStarted(true)
  }

  return (
    <AnimatePresence mode="wait">
      {gameStarted ? (
        <motion.main
          key="game"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex min-h-screen flex-col items-center justify-center p-2 bg-gradient-to-b from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800"
        >
          <div className="w-full max-w-md mx-auto">
            <RockPaperScissors onExit={() => setGameStarted(false)} />
          </div>
        </motion.main>
      ) : (
        <motion.main
          key="home"
          className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden"
          style={{
            backgroundImage:
              'url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1000_F_115575013_bGdWptTXmcWnYIYT3W9JyDWi4mTQHyGj.jpg-sNoNxRuNmiG2GJJKC7qmIvxRU50hBB.jpeg")',
            backgroundSize: "400px",
            backgroundRepeat: "repeat",
          }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/50 to-purple-600/50 backdrop-blur-sm" />

          {/* Content */}
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">ROCK PAPER</h1>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">SCISSORS</h1>
              <div className="flex justify-center gap-4 text-5xl md:text-6xl">
                <motion.span
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                >
                  🪨
                </motion.span>
                <motion.span
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1, delay: 0.3 }}
                >
                  📄
                </motion.span>
                <motion.span
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1, delay: 0.6 }}
                >
                  ✂️
                </motion.span>
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <Button
                onClick={handleStartGame}
                className="bg-white hover:bg-gray-100 text-blue-600 font-bold text-xl px-8 py-6 rounded-full shadow-lg transform transition-all hover:scale-105 hover:shadow-xl"
              >
                START GAME
              </Button>
            </motion.div>
          </div>

          {/* Bottom text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 text-white/80 text-sm"
          >
            Win rounds to earn RPS tokens!
          </motion.div>
        </motion.main>
      )}
    </AnimatePresence>
  )
}

