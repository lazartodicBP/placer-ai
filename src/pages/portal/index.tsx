import React from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar/Sidebar";
import TopNavigation from "../../components/TopNavigation/TopNavigation";
import Navbar from "@/components/Navbar/Navbar";

const PortalPage = () => {
  return (
    // <div className="u-flex u-w-full">
    //   <Sidebar />
    //   <div>
    //     <TopNavigation username="Test user" />
    //     <div className="center-message">
    //       <div className="mt-20">
    //         {/* <img
    //           src="./phone-cloud-icon.png"
    //           alt="phone"
    //           className="phone-logo m-auto"
    //         /> */}
    //         <div>
    //           <h2 className="text-center">Thank you</h2>
    //         </div>
    //         <div>
    //           <h4 className="text-center">
    //             You've just started your 30-day trial.
    //           </h4>
    //         </div>
    //         <div>
    //           <span>
    //             voluptatem accusantium doloremque laudantium, totam rem aperiam
    //             eaque ipsa, quae ab illo inventore veritatis et quasi architecto
    //             beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem,
    //             quia voluptas sit, aspernatur aut odit aut fugit, sed quia
    //             consequuntur magni dolores eos, qui ratione voluptatem sequi
    //             nesciunt, neque porro quisquam est
    //           </span>
    //         </div>
    //         <div className="u-flex u-justify-center u-w-full">
    //           <Link href="/public">
    //             <button className="u-btn action">Manage Subscription</button>
    //           </Link>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
    <div>
      <Navbar />
      <div className="home-page">
        <img src="/background.svg" className="background-map-image"/>
        <div className="u-flex u-justify-center">
          <div className="thankyou-wrapper">
            <div className="thankyou-box">
              <h1>Thank&nbsp;You For Subscribing</h1>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default PortalPage;
