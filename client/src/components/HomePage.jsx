import React from "react";
import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import FaqSection from "./FaqSection";
import ContactSection from "./ContactSection";

function HomePage({ onOpenRegister }) {
  return (
    <>
      <HeroSection onOpenRegister={onOpenRegister} />
        <AboutSection />
      <FaqSection />
        <ContactSection />
    </>
  );
}

export default HomePage;
