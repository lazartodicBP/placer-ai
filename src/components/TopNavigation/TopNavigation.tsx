import React from "react";
// import "./TopNavigation.css";

const TopNavigation = (props) => {
  return (
    <div className="top-navigation">
      <div className="u-flex u-justify-between wrap-mobile">
        <div className="u-flex">
          <span>
            Hi, {props.username}! You have {props.daysLeft} Days Left In Your
            Trial.{" "}
          </span>
          <button className="u-btn action">Manage Subscription</button>
        </div>
        <div className="u-flex">
          <img
            src={`/user-icon.png`}
            alt="user icon"
          />
          <span>{props.username}</span>
          <img
            src={`/polygon-icon.png`}
            alt="img"
            className="u-my-auto"
          />
          <span className="pipe">|</span>
          <span>Help</span>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
