import { PLAN_TIERS } from '@/constants/planTiers';

export type Product = {
  Id: string;
  Name: string;
  Rate: string;
  CurrencySign?: string;
  Amount?: string;
  Status?: string;
};

export const descriptions = Object.fromEntries(
  Object.entries(PLAN_TIERS).map(([tier, { id, name, image }]) => [
    id,
    {
      title: name,
      description: '',
      image,
    },
  ])
);

export const productsData: Product[] = [
  {
    Id: PLAN_TIERS.silver.id,
    Name: PLAN_TIERS.silver.name,
    Rate: '$500.00',
    Status: 'ACTIVE',
  },
  {
    Id: PLAN_TIERS.gold.id,
    Name: PLAN_TIERS.gold.name,
    Rate: '$3000.00',
    Status: 'DEACTIVATED',
  },
  {
    Id: PLAN_TIERS.platinum.id,
    Name: PLAN_TIERS.platinum.name,
    Rate: '$5000.00',
    Status: 'DEACTIVATED',
  },
];
