import React, { useState } from "react";
import { Link as LinkRouter } from "react-router-dom";
import "./Filter.css";

function FilterComponent() {
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  const handleFilter = (event) => {
    event.preventDefault();
    // Implement filter logic here based on filterType, filterLocation, and filterPrice
    console.log("Filter applied:", filterType, filterLocation, filterPrice);
  };

  return (
    <div className="filter">
      <form onSubmit={handleFilter} className="filter-f-content">
        <LinkRouter to="/client/info">
          <button type="submit" className="filter-btn">
            Filter
          </button>
        </LinkRouter>
        <label className="distance" htmlFor="type">
          Type{" "}
        </label>
        <input
          className="bx"
          type="text"
          id="type"
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
        />
        <label className="distance" htmlFor="location">
          Location{" "}
        </label>
        <input
          className="bx"
          type="text"
          id="location"
          value={filterLocation}
          onChange={(event) => setFilterLocation(event.target.value)}
        />
        <label className="distance" htmlFor="price">
          Price{" "}
        </label>
        <input
          className="bx"
          type="number"
          id="price"
          value={filterPrice}
          onChange={(event) => setFilterPrice(event.target.value)}
        />
      </form>
      <div className="horizontal-line"></div>
    </div>
  );
}

export default FilterComponent;
