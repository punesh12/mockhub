"use client"

import { useRef } from "react"
import { useScroll } from "framer-motion"
import { LandingNav } from "@/components/landing-nav"
import { HeroSection } from "@/components/shared/landing/hero-section"
import { HowItWorksSection } from "@/components/shared/landing/how-it-works-section"
import { FeaturesSection } from "@/components/shared/landing/features-section"
import { DemoSection } from "@/components/shared/landing/demo-section"
import { CTASection } from "@/components/shared/landing/cta-section"
import { FooterSection } from "@/components/shared/landing/footer-section"

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col overflow-hidden"
    >
      <LandingNav />
      <HeroSection scrollYProgress={scrollYProgress} />
      <HowItWorksSection />
      <FeaturesSection />
      <DemoSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
