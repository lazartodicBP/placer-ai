import { GetServerSideProps, NextPage } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar/Navbar'
import Card from '@/components/Card/Card'
import Loader from '@/components/Loader/Loader'
import { productsData, descriptions, Product } from '@/services/products-data'
import {SubscriptionIcon} from "@/components/SubscriptionCardIcon";

type Props = {
  products: Product[]
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return { props: { products: productsData } }
}

const getTierFromId = (id: string): 'silver' | 'gold' | 'platinum' => {
  if (id === '14197') return 'silver';
  if (id === '14198') return 'gold';
  return 'platinum';
};

const HomePage: NextPage<Props> = ({ products }) => (
  <div>
    <Navbar />
    <div className="home-page">
      <img src="/background.svg" className="background-map-image"/>
      <div className="homepage-container">
        <div className="u-flex u-justify-center">
          <h1 className="home-page__header">
            Grow Your Business With Placer.ai
          </h1>
        </div>

        {/* Subheader */}
        <div className="u-flex u-justify-center">
          <h2 className="home-page__subheader">
            Pricing That’s Tailored For Your Needs
          </h2>
        </div>

        {/* Plans */}
        <div className="home-page__plans">
          {products.length === 0 ? (
            <Loader />
          ) : (
            products.map((item, index) => {
              const description = descriptions[item.Id];

              return (
                <Card
                  key={item.Id}
                  className={`plan-card__type-${index}`}
                >
                  <div className="u-h-full u-flex u-column u-text-center">

                    {/* Single image block at the top */}
                    <div className="plan-card__images">
                      <SubscriptionIcon
                        src={description.image.src}
                        alt={description.image.alt}
                        tier={getTierFromId(item.Id)}
                      />
                    </div>

                    {(() => {
                      const [mainTitle, tier] = item.Name.split(' - ');
                      return (
                        <div className="plan-card__title-group">
                          <h2 className="plan-card__title-main">{mainTitle}</h2>
                          <h3 className="plan-card__title-tier">{tier}</h3>
                        </div>
                      );
                    })()}
                    <p className="plan-card__price">{item.Rate}</p>
                    <span className="plan-card__price-description">USD/year</span>
                    <div className="plan-card__divider" />
                    <p className="plan-card__product-description">
                      {description.title}
                    </p>
                    <p className="plan-card__product-description--secondary">
                      {description.description}
                    </p>

                    <div className="plan-card__try-btn-container">
                      <Link
                        href={`/register?planId=${item.Id}`}
                        className="u-btn u-btn--focus plan-card__try-btn"
                      >
                        Try it now
                      </Link>
                    </div>

                  </div>
                </Card>
              );
            })

          )}
        </div>
      </div>

    </div>

  </div>
)

export default HomePage