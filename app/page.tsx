"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  Zap,
  Code,
  History,
  Shield,
  Sparkles,
  Globe,
  ArrowRight,
  CheckCircle2,
  Play,
} from "lucide-react"
import { useRef } from "react"

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])

  const features = [
    {
      icon: Zap,
      title: "Instant Mock APIs",
      description:
        "Create mock endpoints in seconds with custom responses and HTTP methods.",
      color: "from-yellow-500/20 to-orange-500/20",
    },
    {
      icon: Code,
      title: "API Testing Playground",
      description:
        "Test real or mock endpoints directly from your browser with full request/response visualization.",
      color: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: History,
      title: "Request History",
      description:
        "Automatically save all your API requests and responses for quick reference and debugging.",
      color: "from-purple-500/20 to-pink-500/20",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description:
        "JWT-based authentication ensures your mocks and data are secure and private.",
      color: "from-green-500/20 to-emerald-500/20",
    },
    {
      icon: Sparkles,
      title: "Mock Data Generator",
      description:
        "Generate realistic JSON data automatically using Faker.js to save time.",
      color: "from-indigo-500/20 to-violet-500/20",
    },
    {
      icon: Globe,
      title: "Shareable URLs",
      description:
        "Get shareable mock API URLs that you can use across your projects and teams.",
      color: "from-rose-500/20 to-red-500/20",
    },
  ]

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
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  console.log("DATABASE_URL", process.env.DATABASE_URL)

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col overflow-hidden"
    >
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 md:py-32 overflow-hidden">
        {/* Animated Background Gradient */}
        <motion.div className="absolute inset-0 -z-10" style={{ y, opacity }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        </motion.div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            className="flex flex-col items-center text-center space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
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
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Mock, Test & Visualize
              <br />
              <motion.span
                className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
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
              className="max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              A lightweight, beautiful alternative to Postman + Mock Server.
              Create mock APIs instantly, test endpoints, and visualize
              responses—all in one unified dashboard.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 sm:flex-row"
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
                  <Link href="/auth/login" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Watch Demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground"
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
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="container mx-auto max-w-6xl px-4 relative z-10">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Mock & Test APIs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for modern developers
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-xl relative overflow-hidden group h-full">
                    {/* Gradient Background on Hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    <CardHeader className="relative z-10">
                      <motion.div
                        className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3,
                          }}
                        >
                          <Icon className="h-6 w-6 text-primary" />
                        </motion.div>
                      </motion.div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundSize: "200% 200%",
          }}
        />

        <div className="container mx-auto max-w-4xl px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm shadow-xl">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <CardTitle className="text-3xl">
                    Ready to Get Started?
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Join developers who are already using MockHub to streamline
                    their API development workflow.
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full px-8 shadow-lg"
                  >
                    <Link
                      href="/auth/signup"
                      className="flex items-center gap-2"
                    >
                      Create Free Account
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
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        className="border-t py-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2025 MockHub. Built with Next.js, TypeScript & shadcn/ui
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              {["Docs", "GitHub", "Support"].map((link, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1, color: "hsl(var(--primary))" }}
                >
                  <Link href="#" className="transition-colors">
                    {link}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
