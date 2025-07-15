import { Product } from "@/services/products-data";
import { fetchWithSession } from "@/services/auth";

export const getChildProducts = async (id: string) => {
  const query = `
      select Id, Name from Product
      where parent_product = '${id}'
  `;

  const response = await fetchWithSession(`${process.env.API_URL}/query?sql=${query}`);
  return await response.json();
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch('/api/products');
    const rows = await response.json();

    return rows.map(parseProduct);
  } catch (e) {
    console.error("Error fetching products:", e);
    return [];
  }
};

const parseProduct = (row: any): Product => {
  const Rate = row.Rate ?? '';
  const CurrencySign = Rate.match(/^\D+/)?.[0] || '';
  const Amount = Rate.match(/\d+(\.\d+)?/)?.[0] || '';
  return { ...row, CurrencySign, Amount };
};
