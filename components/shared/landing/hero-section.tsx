"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, MotionValue, useScroll, useTransform } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Terminal,
  Copy,
  Check,
} from "lucide-react"
import { useState, useRef } from "react"

interface HeroSectionProps {
  scrollYProgress?: MotionValue<number>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

const codeExample = `// Create a mock API endpoint
POST /api/mocks
{
  "method": "GET",
  "endpoint": "/users",
  "responseCode": 200,
  "responseBody": {
    "users": [
      { "id": 1, "name": "John Doe" }
    ]
  }
}

// Use your mock API
GET https://mockhub.app/api/users
→ Returns your custom response instantly`

export function HeroSection({ scrollYProgress }: HeroSectionProps) {
  const [copied, setCopied] = useState(false)

  // Use scrollYProgress if provided, otherwise create local one
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress: localScrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const progress = scrollYProgress || localScrollYProgress

  const y = useTransform(progress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(progress, [0, 1], [1, 0])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeExample)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex flex-col items-center justify-center px-4 pt-32 pb-20 md:py-40 overflow-hidden"
    >
      {/* Animated Background Gradient */}
      <motion.div className="absolute inset-0 -z-10" style={{ y, opacity }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          className="flex flex-col lg:flex-row items-center gap-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Left: Text Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 rounded-full border bg-muted/50 backdrop-blur-sm px-4 py-1.5 text-sm shadow-sm"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-muted-foreground">
                Developer-Focused API Tool
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
            >
              Mock, Test & Visualize
              <br />
              <motion.span
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                APIs in One Place
              </motion.span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground mx-auto lg:mx-0 px-4 sm:px-0"
            >
              A lightweight, beautiful alternative to Postman + Mock Server.
              Create mock APIs instantly, test endpoints, and visualize
              responses—all in one unified dashboard.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 sm:flex-row justify-center lg:justify-start"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  size="lg"
                  variant="gradient"
                  className="rounded-full px-8 shadow-lg"
                >
                  <Link href="/auth/signup" className="flex items-center gap-2">
                    Get Started Free
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 backdrop-blur-sm"
                >
                  <Link href="#demo" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    See Demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8 text-sm text-muted-foreground"
            >
              {[
                "No credit card required",
                "Free forever",
                "Open source ready",
              ].map((text, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.5,
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </motion.div>
                  <span>{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Code Example */}
          <motion.div
            variants={itemVariants}
            className="flex-1 w-full max-w-2xl"
          >
            <Card className="border-2 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm shadow-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-mono">Quick Start</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-7 px-2"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <motion.pre
                  className="text-xs sm:text-sm font-mono text-muted-foreground overflow-x-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.code
                    animate={{
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {codeExample}
                  </motion.code>
                </motion.pre>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

