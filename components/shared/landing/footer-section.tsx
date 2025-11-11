"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"

export function FooterSection() {
  return (
    <motion.footer
      className="border-t py-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} MockHub. Built with{" "}
            <motion.span
              className="inline-block"
              whileHover={{ scale: 1.1 }}
            >
              ❤️
            </motion.span>
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {["Docs", "GitHub", "Support"].map((link, index) => (
              <motion.a
                key={index}
                href="#"
                className="hover:text-primary transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                {link}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  )
}

