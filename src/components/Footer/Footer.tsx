import React, { FC } from "react";
// import "./Footer.css";

interface FooterProps {
  position?: "static" | "relative" | "absolute" | "sticky" | "fixed"
}

const Footer: FC<FooterProps> = ({ position }) => {

  return <div className="footer-container" style={position ? { position } : {}}>
    <div className="u-flex u-column">
      <span>Privacy | Terms</span>
    </div>
  </div>

};

export default Footer;
