import React, { FC, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Card from "../../components/Card/Card";
import PaymentForm from "../../components/PaymentForm/PaymentForm";
import { getHppSecurityToken } from "@/services/auth";
import { getProducts } from "@/services/products";
import Footer from "../../components/Footer/Footer";

const NEXT_PAYMENT_DIFF_DAYS = 30;
const paymentDate = new Date();
paymentDate.setDate(paymentDate.getDate() + NEXT_PAYMENT_DIFF_DAYS);

const RegisterPage: FC<{ token: string }> = ({ token }) => {
  const [products, setProducts] = useState<Record<string, any>[]>([]);
  const [allowForm, setAllowForm] = useState(false);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data || []);
    });
  }, []);

  const { totalRate } = useMemo(() => {
    const total = products.reduce((prev, curr) => {
      return prev + Number(curr.Rate.substring(1));
    }, 0);

    return {
      total,
      totalRate: new Intl.NumberFormat("en-In", {
        style: "currency",
        currency: "AUD",
      }).format(total),
      currency: products.length ? products[0].Rate.charAt(0) : "$",
    };
  }, [products]);

  return (
    <div>
      <Navbar />
      <div className="u-w-full page-content">
        <div className="u-flex u-justify-center flex-wrap">
          <div className="form-description">
            <div className="text-center">
              <h3 className="header">Shopping cart:</h3>
            </div>
            <div>
              <div className="u-flex u-column">
                {products.map((product) => (
                  <div key={product.Id} className="u-flex u-w-full u-justify-between">
                    <span>{product?.Name}</span>
                    <span>{product?.Rate}</span>
                  </div>
                ))}
                <div className="u-flex u-w-full u-justify-between">
                  <span>Tax</span>
                  <span>0</span>
                </div>
                <div className="u-flex u-w-full u-justify-between total-block">
                  <span>Total</span>
                  <span>{totalRate}</span>
                </div>
                <span className="card-label">
                  Your card will be charged on{" "}
                  {paymentDate.toLocaleDateString("en", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  . You can cancel anytime before that.
                </span>

                <div className="terms-block">
                  <h4>Terms & Conditions</h4>
                  <div className="u-flex">
                    <input
                      type="checkbox"
                      checked={allowForm}
                      onChange={(e) => setAllowForm(e.target.checked)}
                    />
                    <span className="terms-text">
                      I have read the Privacy Policy and agree with the Terms and Conditions.
                      I agree that by registering I am also registering to the network and that News Pty Limited
                      and any of its related companies can contact me with special offers,
                      marketing information and newsletters.
                      I can unsubscribe at any time.
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="businesses">
              <div className="secondary-text">
                voluptatem accusantium doloremque laudantium, totam rem aperiam
                eaque ipsa, quae ab illo inventore veritatis et quasi architecto
                beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem,
                quia voluptas sit, aspernatur aut odit aut fugit, sed quia
                consequuntur magni dolores eos, qui ratione voluptatem sequi
                nesciunt, neque porro quisquam est
              </div>
            </div>
          </div>
          <div className="billing-form u-justify-center">
            <Card disabled={!allowForm} >
              <PaymentForm products={products} token={token} />
            </Card>
          </div>
        </div>
        <Footer position="fixed" />
      </div>
    </div>
  );
};

export const getServerSideProps = async () => {
  console.log("Getting security token");
  const token = await getHppSecurityToken();
  console.log("Token:", token);
  return {
    props: { token: token || "" },
  };
};

export default RegisterPage;
