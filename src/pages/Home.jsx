import React from "react";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div>
      <Navbar />
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <h1>Home Page</h1>
      </div>
    </div>
  );
};

export default Home;
