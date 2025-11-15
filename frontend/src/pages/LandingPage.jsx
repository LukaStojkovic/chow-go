import React from "react";

import HomeNavBar from "@/components/HomeNavBar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";
import AppDownloadSection from "@/components/AppDownloadSection";
import FeaturesSection from "@/components/FeaturesSection";
import BrushEffect from "@/components/BrushEffect";

export default function LandingPage() {
  return (
    <>
      <BrushEffect />

      <HomeNavBar />

      <HeroSection />

      <StatsSection />

      <FeaturesSection />

      <AppDownloadSection />

      <Footer />
    </>
  );
}
