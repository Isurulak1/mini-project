import React from "react";
import "./Hero.css";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";

const Hero = () => {
  return (
    <div className="hero container" id="Hero">
      <div className="hero-text">
        <h1 className="hero-head">ShutterShare</h1>
        <p className="hero-para">
          Experience the epitome of photography networking on our platform and
          elevate your craft and expand your reach with our unparalleled
          networking opportunities.
        </p>
        <Link to="/login" style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            color="primary"
            sx={{
              padding: "15px 65px", 
              fontSize: "25px",
              borderRadius: "5px",
              textAlign: "center",
              textTransform: "none",
            }}
          >
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Hero;
