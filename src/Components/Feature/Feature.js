import React from "react";
import "./Feature.css";
import icon1 from "../../Assets/Icon1.png";
import icon2 from "../../Assets/Icon2.png";
import icon3 from "../../Assets/Icon3.png";
import icon4 from "../../Assets/Icon4.png";

const Feature = () => {
  return (
    <div className="feature container" id="Feature">
      <div className="feature-head">
        <h1>Feature</h1>
        <div className="line"></div>
      </div>
      <div className="featurecolumn">
        <div className="f-col-1">
          <h2>Best Photo Selection with Machine Learning</h2>
          <p>
            A cutting-edge photo selection feature seamlessly identifies and
            prioritizes images showcasing optimal facial expressions, like
            smiles, streamlining the process for clients. Through advanced
            algorithms, it ensures that only the most captivating and emotive
            photographs are chosen effortlessly.
          </p>
        </div>
        <div className="f-col-2">
          <img src={icon1} alt="" className="icon" />
        </div>
      </div>
      <div className="featurecolumn">
        <div className="f-col-2">
          <img src={icon2} alt="" className="icon" />
        </div>
        <div className="f-col-1">
          <h2>Portfolio Showcase for Photographers</h2>
          <p>
            The portfolio showcase feature enables photographers to upload and
            display their best work on their profiles. This allows potential
            clients to browse through high-quality images and get a sense of the
            photographer's style and expertise.
          </p>
        </div>
      </div>
      <div className="featurecolumn">
        <div className="f-col-1">
          <h2>Direct Messaging Feature</h2>
          <p>
            The direct messaging feature facilitates seamless communication
            between photographers and clients. It allows users to exchange
            messages in real time, discuss project details, negotiate terms, and
            share updates without leaving the platform.
          </p>
        </div>
        <div className="f-col-2">
          <img src={icon3} alt="" className="icon" />
        </div>
      </div>
      <div className="featurecolumn">
        <div className="f-col-2">
          <img src={icon4} alt="" className="icon" />
        </div>
        <div className="f-col-1">
          <h2>Upload and Share Photos Without Losing Quality</h2>
          <p>
            The photo upload and sharing feature is designed to maintain the
            original quality and resolution of images. Photographers can upload
            their photos without worrying about compression or quality loss,
            ensuring that clients see the images in their true form.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feature;
