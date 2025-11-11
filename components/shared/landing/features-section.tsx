"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Zap, Code, History, Shield, Sparkles, Globe } from "lucide-react"

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

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
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

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-t bg-muted/30 py-20 relative overflow-hidden"
    >
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
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
  )
}

