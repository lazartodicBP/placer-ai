import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar/Navbar";

const NotFoundPage = () => {
  
  return <div>
    <Navbar/>
    <div className="mt-2">
      <div className="u-flex u-w-full u-justify-center">
        <h1>Not found</h1>
      </div>
      <div className="u-flex w-full u-justify-center">
        <Link href="/public">Home</Link>
      </div>
    </div>
  </div>

};

export default NotFoundPage;
