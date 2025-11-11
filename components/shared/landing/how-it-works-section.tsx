"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Plus, Send, BarChart3 } from "lucide-react"

const howItWorks = [
  {
    step: 1,
    icon: Plus,
    title: "Create Mock API",
    description:
      "Define your endpoint, HTTP method, and response. It takes just seconds.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: 2,
    icon: Send,
    title: "Test Instantly",
    description:
      "Use our built-in playground to test your mock APIs or real endpoints.",
    color: "from-purple-500 to-pink-500",
  },
  {
    step: 3,
    icon: BarChart3,
    title: "Track History",
    description:
      "All requests are automatically saved for debugging and analysis.",
    color: "from-green-500 to-emerald-500",
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-t bg-background py-20 relative overflow-hidden"
    >
      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps. No complex setup required.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {howItWorks.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -8 }}
              >
                <Card className="border-2 h-full relative overflow-hidden group">
                  {/* Step Number Badge */}
                  <div className="absolute top-4 right-4">
                    <motion.div
                      className={`h-8 w-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {step.step}
                    </motion.div>
                  </div>

                  {/* Gradient Background */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />

                  <CardHeader className="relative z-10 pt-12">
                    <motion.div
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r ${step.color} shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                  </CardContent>

                  {/* Connecting Line (not for last item) */}
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

