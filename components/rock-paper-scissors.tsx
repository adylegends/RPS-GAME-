"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Confetti from "react-confetti"
import { useWindowSize } from "react-use"
import { AlertCircle, Clock } from "lucide-react"
import Image from "next/image"

type Choice = "rock" | "paper" | "scissors" | null
type Result = "win" | "lose" | "draw" | null

type GameStats = {
  roundsPlayed: number
  lastPlayedDate: string
  tokenBalance: number
}

// Add this prop to the component
interface RockPaperScissorsProps {
  onExit?: () => void
}

export default function RockPaperScissors({ onExit }: RockPaperScissorsProps) {
  const [playerChoice, setPlayerChoice] = useState<Choice>(null)
  const [computerChoice, setComputerChoice] = useState<Choice>(null)
  const [result, setResult] = useState<Result>(null)
  const [score, setScore] = useState({ player: 0, computer: 0 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const { width, height } = useWindowSize()
  const [clickSound] = useState(() =>
    typeof Audio !== "undefined"
      ? new Audio(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mouse-click-290204-8QwQ3Z5n2zAna1LMw2hw9gMWPStlmx.mp3",
        )
      : null,
  )
  const [winSound] = useState(() =>
    typeof Audio !== "undefined"
      ? new Audio(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mixkit-achievement-bell-600-n5FCRpRbkTejiZKppwdIvwIagnjNo0.wav",
        )
      : null,
  )
  const [gameStats, setGameStats] = useState<GameStats>({ roundsPlayed: 0, lastPlayedDate: "", tokenBalance: 0 })
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [timeUntilReset, setTimeUntilReset] = useState<string>("")
  const [tokensWon, setTokensWon] = useState(0)
  const [showTokenAnimation, setShowTokenAnimation] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // Add a new state to track if there's an unclaimed win
  const [hasUnclaimedWin, setHasUnclaimedWin] = useState(false)

  const MAX_DAILY_ROUNDS = 10
  const choices: Choice[] = ["rock", "paper", "scissors"]
  const TOKEN_NAME = "RPS"

  // Calculate time until midnight (when limit resets)
  const calculateTimeUntilReset = useCallback(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const diffMs = tomorrow.getTime() - now.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHrs}h ${diffMins}m`
  }, [])

  // Update the time until reset every minute
  useEffect(() => {
    if (isLimitReached) {
      setTimeUntilReset(calculateTimeUntilReset())

      timerRef.current = setInterval(() => {
        setTimeUntilReset(calculateTimeUntilReset())
      }, 60000) // Update every minute
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isLimitReached, calculateTimeUntilReset])

  // Load game stats from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStats = localStorage.getItem("rpsGameStats")
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats)
        const today = new Date().toDateString()

        // Reset rounds if it's a new day
        if (parsedStats.lastPlayedDate !== today) {
          const newStats = {
            roundsPlayed: 0,
            lastPlayedDate: today,
            tokenBalance: parsedStats.tokenBalance || 0, // Keep token balance
          }
          setGameStats(newStats)
          localStorage.setItem("rpsGameStats", JSON.stringify(newStats))
        } else {
          // Ensure tokenBalance exists in older saved data
          const updatedStats = {
            ...parsedStats,
            tokenBalance: parsedStats.tokenBalance || 0,
          }
          setGameStats(updatedStats)
          setIsLimitReached(updatedStats.roundsPlayed >= MAX_DAILY_ROUNDS)
        }
      } else {
        // Initialize stats if they don't exist
        const newStats = {
          roundsPlayed: 0,
          lastPlayedDate: new Date().toDateString(),
          tokenBalance: 0,
        }
        setGameStats(newStats)
        localStorage.setItem("rpsGameStats", JSON.stringify(newStats))
      }
    }
  }, [])

  // Update localStorage when game stats change
  useEffect(() => {
    if (typeof window !== "undefined" && gameStats.lastPlayedDate) {
      localStorage.setItem("rpsGameStats", JSON.stringify(gameStats))
    }
  }, [gameStats])

  const getComputerChoice = (): Choice => {
    const randomIndex = Math.floor(Math.random() * 3)
    return choices[randomIndex]
  }

  // Modify the determineWinner function to set the unclaimed win state
  const determineWinner = (player: Choice, computer: Choice): Result => {
    if (player === computer) return "draw"
    if (
      (player === "rock" && computer === "scissors") ||
      (player === "paper" && computer === "rock") ||
      (player === "scissors" && computer === "paper")
    ) {
      // Set hasUnclaimedWin to true when player wins
      setHasUnclaimedWin(true)
      return "win"
    }
    return "lose"
  }

  // Calculate tokens to award - always returns 1
  const calculateTokensToAward = useCallback(() => {
    // Always award exactly 1 token per win
    return 1
  }, [])

  // Function to update rounds played - separate from the effect
  const updateRoundsPlayed = useCallback(() => {
    setGameStats((prevStats) => {
      const newRoundsPlayed = prevStats.roundsPlayed + 1
      const newStats = {
        ...prevStats,
        roundsPlayed: newRoundsPlayed,
      }

      // Check if limit reached
      if (newRoundsPlayed >= MAX_DAILY_ROUNDS) {
        setIsLimitReached(true)
      }

      return newStats
    })
  }, [MAX_DAILY_ROUNDS])

  // Modify the awardTokens function to be called on claim instead of automatically
  const awardTokens = useCallback(
    (amount: number) => {
      setTokensWon(amount)
      setShowTokenAnimation(true)
      setHasUnclaimedWin(false) // Reset unclaimed win state

      // Play win sound
      if (winSound) {
        winSound.currentTime = 0
        winSound.play().catch((err) => console.error("Error playing win sound:", err))
      }

      // Update token balance
      setGameStats((prevStats) => ({
        ...prevStats,
        tokenBalance: prevStats.tokenBalance + amount,
      }))

      // Hide animation after a delay
      setTimeout(() => {
        setShowTokenAnimation(false)
      }, 3000)
    },
    [winSound],
  )

  // Add a handleClaim function
  const handleClaim = () => {
    if (clickSound) {
      clickSound.currentTime = 0
      clickSound.play().catch((err) => console.error("Error playing sound:", err))
    }

    const tokensToAward = calculateTokensToAward()
    awardTokens(tokensToAward)
  }

  const handleChoice = (choice: Choice) => {
    if (isPlaying || isLimitReached || hasUnclaimedWin) return

    // Play click sound
    if (clickSound) {
      clickSound.currentTime = 0
      clickSound.play().catch((err) => console.error("Error playing sound:", err))
    }

    setIsPlaying(true)
    setPlayerChoice(choice)
    setCountdown(3)
  }

  // Modify the useEffect that handles the countdown to NOT automatically award tokens
  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      const computer = getComputerChoice()
      setComputerChoice(computer)

      if (playerChoice) {
        const gameResult = determineWinner(playerChoice, computer)
        setResult(gameResult)

        if (gameResult === "win") {
          setScore((prev) => ({ ...prev, player: prev.player + 1 }))
          setShowConfetti(true)

          // No longer automatically award tokens here
          // Instead, we'll show the CLAIM button

          setTimeout(() => setShowConfetti(false), 3000)
        } else if (gameResult === "lose") {
          setScore((prev) => ({ ...prev, computer: prev.computer + 1 }))
        }

        // Update rounds played after the game is complete
        updateRoundsPlayed()
      }

      const resetTimer = setTimeout(() => {
        setIsPlaying(false)
        setCountdown(null)
      }, 2500)

      return () => clearTimeout(resetTimer)
    }
  }, [countdown, playerChoice, updateRoundsPlayed, calculateTokensToAward])

  // Modify the resetGame function to also reset the unclaimed win state
  const resetGame = () => {
    setPlayerChoice(null)
    setComputerChoice(null)
    setResult(null)
    setIsPlaying(false)
    setCountdown(null)
    setHasUnclaimedWin(false)
  }

  const resetScore = () => {
    setScore({ player: 0, computer: 0 })
    resetGame()
  }

  const getResultMessage = () => {
    if (result === "win") return "You Win! 🎉"
    if (result === "lose") return "You Lose! 😢"
    if (result === "draw") return "It's a Draw! 🤝"
    return ""
  }

  const getChoiceEmoji = (choice: Choice, size = "text-4xl") => {
    switch (choice) {
      case "rock":
        return <span className={size}>🪨</span>
      case "paper":
        return <span className={size}>📄</span>
      case "scissors":
        return <span className={size}>✂️</span>
      default:
        return null
    }
  }

  const getResultBackground = (result: Result) => {
    if (result === "win") return "bg-gradient-to-r from-green-400 to-emerald-500"
    if (result === "lose") return "bg-gradient-to-r from-red-400 to-pink-500"
    if (result === "draw") return "bg-gradient-to-r from-yellow-400 to-amber-500"
    return "bg-gradient-to-r from-blue-400 to-indigo-500"
  }

  const getRemainingRounds = () => {
    return MAX_DAILY_ROUNDS - gameStats.roundsPlayed
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}

      {/* Game Title */}
      <div className="w-full text-center mb-1">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          ROCK, PAPER, SCISSORS
        </h1>
      </div>

      {/* Top Status Bar */}
      <div className="w-full grid grid-cols-2 gap-2 mb-1">
        {/* Token Balance - Left Side */}
        <div className="flex justify-start">
          <Badge
            variant="outline"
            className="text-sm px-2 py-1 bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 backdrop-blur-sm shadow-md text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800/50 flex items-center"
          >
            <div className="w-5 h-5 mr-2 relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20250315_015549-0kesLuB7ZPxfUx4l7HofuPqP1oGJZf.png"
                alt="RPS Logo"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <span>Balance: {gameStats.tokenBalance}</span>
          </Badge>
        </div>

        {/* Daily Limit Indicator - Right Side */}
        <div className="flex justify-end">
          <Badge
            variant="outline"
            className={cn(
              "text-sm px-2 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md",
              getRemainingRounds() <= 3 ? "text-amber-600 dark:text-amber-400" : "",
              getRemainingRounds() <= 0 ? "text-red-600 dark:text-red-400" : "",
            )}
          >
            Rounds Today: {gameStats.roundsPlayed}/{MAX_DAILY_ROUNDS}
          </Badge>
        </div>
      </div>

      {/* Score Board */}
      <div className="flex justify-between w-full mb-1">
        <Badge
          variant="outline"
          className="text-sm px-2 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md"
        >
          You: {score.player}
        </Badge>
        <Badge
          variant="outline"
          className="text-sm px-2 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md"
        >
          Computer: {score.computer}
        </Badge>
      </div>

      {/* Game Area */}
      <Card className="w-full p-3 flex flex-col items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl rounded-xl border-0 relative overflow-hidden">
        {/* Token Animation */}
        <AnimatePresence>
          {showTokenAnimation && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: -20, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-emerald-400 px-4 py-2 rounded-full text-white font-bold shadow-lg">
                <div className="w-5 h-5 relative">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20250315_015549-0kesLuB7ZPxfUx4l7HofuPqP1oGJZf.png"
                    alt="RPS Logo"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <span>+{tokensWon}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Daily Limit Warning */}
        {isLimitReached && (
          <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200 w-full">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>You've reached your daily limit of {MAX_DAILY_ROUNDS} rounds.</p>
            </div>
            <div className="flex items-center gap-2 mt-2 ml-7">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                Play again in: <span className="font-semibold">{timeUntilReset}</span> (at midnight)
              </p>
            </div>
          </div>
        )}

        {/* Countdown or Result */}
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {countdown !== null && countdown > 0 ? (
              <motion.div
                key="countdown"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-6xl font-bold text-primary"
              >
                {countdown}
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn(
                  "text-2xl font-bold text-center px-6 py-2 rounded-full text-white",
                  getResultBackground(result),
                )}
              >
                {getResultMessage()}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Choices Display */}
        <div className="flex justify-between w-full my-4">
          <div className="flex flex-col items-center gap-3">
            <div className="text-xl font-medium">You</div>
            <AnimatePresence mode="wait">
              {playerChoice ? (
                <motion.div
                  key={playerChoice}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center shadow-lg",
                    result === "win"
                      ? "bg-green-100 dark:bg-green-900/30 ring-4 ring-green-400"
                      : result === "lose"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : result === "draw"
                          ? "bg-yellow-100 dark:bg-yellow-900/30"
                          : "bg-gray-100 dark:bg-gray-700",
                  )}
                >
                  {getChoiceEmoji(playerChoice)}
                </motion.div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-md">
                  <span className="text-4xl text-gray-400">❓</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center">
            <motion.div
              animate={result ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="text-3xl"
            >
              VS
            </motion.div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="text-xl font-medium">Computer</div>
            <AnimatePresence mode="wait">
              {computerChoice ? (
                <motion.div
                  key={computerChoice}
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center shadow-lg",
                    result === "lose"
                      ? "bg-green-100 dark:bg-green-900/30 ring-4 ring-green-400"
                      : result === "win"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : result === "draw"
                          ? "bg-yellow-100 dark:bg-yellow-900/30"
                          : "bg-gray-100 dark:bg-gray-700",
                  )}
                >
                  {getChoiceEmoji(computerChoice)}
                </motion.div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-md">
                  <span className="text-4xl text-gray-400">❓</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Notification to claim before playing again */}
        {hasUnclaimedWin && !showTokenAnimation && (
          <div className="w-full text-center text-amber-600 dark:text-amber-400 text-xs font-medium mb-2">
            Claim your reward before playing again!
          </div>
        )}

        {/* Claim Button - Only shows when player has won and not claimed */}
        <AnimatePresence>
          {hasUnclaimedWin && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="mb-3 w-full flex justify-center"
            >
              <Button
                onClick={handleClaim}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition-all hover:scale-105 text-base"
              >
                CLAIM {TOKEN_NAME}
                <div className="w-4 h-4 ml-2 relative">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20250315_015549-0kesLuB7ZPxfUx4l7HofuPqP1oGJZf.png"
                    alt="RPS Logo"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choice Buttons */}
        <div className="grid grid-cols-3 gap-2 w-full mt-3">
          {choices.map((choice) => (
            <Button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={isPlaying || isLimitReached || hasUnclaimedWin}
              variant="outline"
              className={cn(
                "h-16 flex flex-col gap-1 items-center justify-center bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md transition-all hover:scale-105",
                (isLimitReached || hasUnclaimedWin) && "opacity-50 cursor-not-allowed",
              )}
            >
              {getChoiceEmoji(choice, "text-2xl")}
              <span className="capitalize text-xs">{choice}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="w-full p-2 mt-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0 rounded-xl">
        <h3 className="font-semibold mb-1 text-center text-sm">How to Play:</h3>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="flex flex-col items-center">
            <div className="text-xl">🪨 beats ✂️</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xl">✂️ beats 📄</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xl">📄 beats 🪨</div>
          </div>
        </div>
        <div className="mt-1 text-xs text-center">
          <p className="text-muted-foreground">Limited to {MAX_DAILY_ROUNDS} rounds per day</p>
          <p className="mt-1 text-amber-600 dark:text-amber-400 font-medium">
            Win to earn 1 {TOKEN_NAME} token! Don't forget to claim your reward!
          </p>
        </div>
      </Card>
    </div>
  )
}

