import { Link as LinkRouter } from "react-router-dom";
import React from "react";
import "./Choose.css";

const Choose = () => {
  return (
    <div className="choose container">
      <div className="choose-head">
        <h1>Choose Side </h1>
      </div>
      <div className="line-choose"></div>
      <div className="choose-select">
        <LinkRouter to="/photographersignup">
          <button className="ch-btn-ph">Photographer</button>
        </LinkRouter>
        <LinkRouter to="/clientsignup">
          <button className="ch-btn-cl">Client</button>
        </LinkRouter>
      </div>
    </div>
  );
};

export default Choose;
