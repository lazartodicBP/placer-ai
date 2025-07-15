const hboImage = {
  src: "/hbo-logo.png",
  width: 49,
  height: 53,
};

const netflixImage = {
  src: "/netflix-logo.png",
  width: 30,
  height: 53,
};

const cinemaxImage = {
  src: "/cinemax-logo.png",
  width: 80,
  height: 53,
};

export const descriptions = {
  "1": {
    title: "HBO",
    description: "GB DVR Storage Fee  ($0.20 per GB)",
    images: [hboImage],
  },
  "14238": {
    title: "HBO + Netflix",
    description: "GB DVR Storage Fee  ($0.20 per GB)",
    images: [hboImage, netflixImage],
  },
  "3": {
    title: "HBO + Netflix + Cinemax",
    description: "GB DVR Storage Fee  ($0.20 per GB)",
    images: [hboImage, netflixImage, cinemaxImage],
  },
};

export type Product = {
  Id: string;
  Name: string;
  Rate: string;
  CurrencySign?: string;
  Amount?: string;
  Status?: string;
};

export const productsData: Product[] = [
  { Id: '1',    Name: 'Bronze Bundle', Rate: '$89.99' },
  { Id: '14238',Name: 'Silver Bundle', Rate: '$95.00' },
  { Id: '3',    Name: 'Gold Bundle',   Rate: '$99.99', Status: 'ACTIVE' },
]
