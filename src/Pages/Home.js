// src/components/Home.js
import React from "react";
import Navbar from "../Components/Navbar/Navbar";
import Hero from "../Components/Hero/Hero";
import About from "../Components/About/About";
import Feature from "../Components/Feature/Feature";
import Footer from "../Components/Footer/Footer";

const Home = () => {
  return (
    <>
      <div>
        <Navbar />
        <Hero />
        <About />
        <Feature />
        <Footer />
      </div>
    </>
  );
};

export default Home;
