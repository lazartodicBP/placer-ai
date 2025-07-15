export const getAccountType = async (): Promise<string | null> => {
  try {
    const response = await fetch("/api/account/type", {
      method: "GET",
    });

    const data = await response.json();
    return data?.Id ?? null;
  } catch (error) {
    console.error("getAccountType error:", error);
    return null;
  }
};

export const createAccount = async (name: string) => {
  try {
    const accountTypeId = await getAccountType();
    console.log("accountTypeId:", accountTypeId);

    const response = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brmObjects: [
          {
            Name: name,
            Status: "ACTIVE",
            AccountTypeId: accountTypeId,
          },
        ],
      }),
    });

    return await response.json();
  } catch (e) {
    console.error("createAccount error:", e);
    return null;
  }
};

export const getRoleByName = async (name: string): Promise<number | null> => {
  try {
    const response = await fetch("/api/account/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    return data?.Id ?? null;
  } catch (e) {
    console.error("getRoleByName error:", e);
    return null;
  }
};

export const createExternalUser = async (
  roleId: number,
  langCode: string,
  timeZoneId: number,
  userName: string,
  accId: number,
  email: string): Promise<string | null> => {
  try {
    const response = await fetch("/api/account/external-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brmObjects: [
          {
            RoleId: roleId,
            Email: email,
            AccountId: accId,
            Username: userName,
            LanguageCode: langCode,
            TimeZoneId: timeZoneId,
            InternalAuthenticationDisabledFlag: 0,
          },
        ],
      }),
    });

    const data = await response.json();
    return data;
  } catch (e) {
    console.error("getRoleByName error:", e);
    return null;
  }
};

export const createBillingProfile = async (
  AccountId: string,
  formData: Record<string, string>
) => {
  try {
    const InvoiceTemplateId = await findDefaultInvoiceTemplateId();
    console.log("AccountId:", AccountId);
    console.log("Form Data:", formData);
    console.log("InvoiceTemplateId:", InvoiceTemplateId);

    const response = await fetch("/api/billing-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brmObjects: [
          {
            Address1: formData.addr1,
            Email: formData.email,
            Country: formData.country,
            City: formData.city,
            State: formData.state,
            Zip: formData.zip,
            TimeZoneId: "0",
            CurrencyCode: "USD",
            MonthlyBillingDate: 31,
            PaymentTermDays: "0",
            BillingMethod: "Electronic Payment",
            BillingCycle: "MONTHLY",
            BillTo: `${formData.firstName} ${formData.lastName}`,
            InvoiceTemplateId,
            Status: "ACTIVE",
            AccountId,
          },
        ],
      }),
    });

    return await response.json();
  } catch (e) {
    console.error("createBillingProfile error:", e);
    return null;
  }
};

export const createAccountProducts = async (
  accountId: string,
  products: Record<string, string>[]
) => {
  try {
    const StartDate = new Date().toISOString().split("T")[0];
    const EndDate = new Date();
    EndDate.setDate(EndDate.getDate() + 30);

    const response = await fetch("/api/account-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brmObjects: products.map(({ Id }) => ({
          Quantity: 1,
          Status: "ACTIVE",
          StartDate,
          EndDate: EndDate.toISOString().split("T")[0],
          ProductId: Id,
          AccountId: accountId,
        })),
      }),
    });

    const data = await response.json();

    return data?.HostedPaymentPageExternalId || null;
  } catch (e) {
    console.error("createAccountProducts error:", e);
    return null;
  }
};

export const getAccountByName = async (name: string): Promise<any | null> => {
  try {
    const response = await fetch("/api/account/by-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.text();
      throw new Error(`API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    console.log("FINAL GETACCOUNT BY NAME: ", data);
    if (!data || Object.keys(data).length === 0) return null;
    return data;
  } catch (error) {
    console.error("getAccountByName error:", error);
    return null;
  }
};

// const findDefaultInvoiceTemplateId = async () => {
//   const { queryResponse } = await fetchWithSession(
//     `${process.env.NEXT_PUBLIC_API_URL}/query?sql=SELECT Id FROM Invoice_Template WHERE Name = 'Default Invoice Template'`
//   ).then((resp) => resp.json());
//   return queryResponse?.[0].Id;
// };

export const findDefaultInvoiceTemplateId = async (): Promise<string | null> => {
  try {
    const response = await fetch("/api/account/invoice-template", {
      method: "GET",
    });

    const data = await response.json();
    return data?.Id ?? null;
  } catch (error) {
    console.error("findDefaultInvoiceTemplateId error:", error);
    return null;
  }
};