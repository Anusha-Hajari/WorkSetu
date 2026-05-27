import React, { useEffect } from "react";
import Hero from "../components/Hero";
import LiveJobTicker from "../components/LiveJobTicker";
import News from "../components/News";
import AIMatchBanner from "../components/AIMatchBanner";
import FeaturedWorkers from "../components/FeaturedWorkers";
import HowItWorksSection from "../components/HowItWorks";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";
import HomeFeatures from "../components/HomeFeatures";
import SetuBridge3D from "../components/SetuBridge3D";
import PremiumCTA from "../components/PremiumCTA";
import { motion, useScroll, useSpring } from "framer-motion";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative" style={{ background: "#080807", minHeight: "100vh" }}>
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[var(--gold)] origin-[0%] z-[100] blur-[1px]"
        style={{ scaleX }}
      />

      <Hero />
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <LiveJobTicker />
      </motion.div>

      <SetuBridge3D />

      <div className="space-y-32 pb-32">
        <HomeFeatures />
        
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,160,89,0.05)_0%,transparent_70%)]" />
          <AIMatchBanner />
        </div>

        <News />
        
        <FeaturedWorkers />
        
        <HowItWorksSection />
        
        <PremiumCTA />
        
        <FAQ />
      </div>

      <Footer />
    </div>
  );
}