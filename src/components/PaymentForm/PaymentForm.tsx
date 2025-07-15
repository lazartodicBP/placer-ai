import React, { FC, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAccountByName,
  createAccount,
  createBillingProfile,
  createAccountProducts, getRoleByName, createExternalUser,
} from "@/services/account";
import Loader from "../Loader/Loader";

const isDev = globalThis.window?.location.hostname === "localhost";

const defaultFormData = {
  firstName: isDev ? "test" : "",
  lastName:  isDev ? "test" : "",
  accountName: isDev ? "testAccount" : "",
  email: isDev ? "@test.com" : "",
  country: isDev ? "USA" : "",
  state: isDev ? "NY" : "",
  city: isDev ? "NY" : "",
  addr1: isDev ? "addr1" : "",
  zip: isDev ? "12345" : "",
};

const formSteps = {
  BILLING_CONTACT: 0,
  PAYMENT_DETAILS: 1,
};

let savedAccount;

const PaymentForm: FC<{ products: Record<string, string>[], token: string }> = ({ products, token }) => {
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [formState, setFormState] = useState({ status: "", message: "" });
  const [step, setStep] = useState(formSteps.BILLING_CONTACT);

  const router = useRouter();

  const buildPaymentForm = async (hostedPaymentPageExternalId, CurrencyCode) => {
    const script = document.createElement("script");
    script.src = "https://cdn.aws.billingplatform.com/hosted-payments-ui@release/lib.js";
    document.body.append(script);
    
    script.onload = function () {

      if (!token || !hostedPaymentPageExternalId || !CurrencyCode || !process.env.NEXT_PUBLIC_HPP_URL || !process.env.NEXT_PUBLIC_BP_ENV_ID) {
        console.error("Missing required values for renderPaymentForm:", {
          token,
          hostedPaymentPageExternalId,
          CurrencyCode,
          apiUrl: process.env.NEXT_PUBLIC_HPP_URL,
          environmentId: process.env.NEXT_PUBLIC_BP_ENV_ID,
        });
        return;
      }

      //@ts-ignore
      window.HostedPayments.renderPaymentForm(
        {
          securityToken: token,
          environmentId: process.env.NEXT_PUBLIC_BP_ENV_ID,
          paymentGateways: {
            creditCard: { gateway: "Adyen_CC" },
            directDebit: { gateway: "Adyen_DD" },
          },
          targetSelector: "#payment-form",
          apiUrl: 'https://my.billingplatform.com/dhdemo3/hostedPayments/1.0',
          // apiUrl: `${window.location.origin}/api/hpp`,
          billingProfileId: hostedPaymentPageExternalId,

          amount: 100,
          walletMode: true,
          fullName: `${formData.firstName} ${formData.lastName}`,
          currencyCode: CurrencyCode,
          countryCode: 'US',
          state: formData.state,
          city: formData.city,
          address: formData.addr1,
          zip: formData.zip,
          email: formData.email,
        },
         {
           successCapture: () => router.push("/portal"),
           addPaymentMethod: () => {
             createAccountProducts(savedAccount?.Id, products);
             router.push("/portal");
           },
         }
      );
    };
  };

  const validateForm = () => {
    let error;
    if (step === formSteps.BILLING_CONTACT) {
      if (!formData.firstName) {
        error = "First Name is required";
      } else if (!formData.lastName) {
        error = "Last Name is required";
      } else if (!formData.accountName) {
        error = "Company Name is required";
      } else if (!formData.email) {
        error = "Email is required";
      } else if (!formData.country) {
        error = "Country is required";
      } else if (!formData.state) {
        error = "State is required";
      } else if (!formData.city) {
        error = "City is required";
      } else if (!formData.addr1) {
        error = "Address is required";
      } else if (!formData.zip) {
        error = "Zip is required";
      }
    }
    if (error) {
      setFormState({
        status: "error",
        message: error,
      });
      return false;
    } else {
      setFormState({
        status: "",
        message: "",
      });
      return true;
    }
  };

  const onFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    savedAccount = null;

    try {
      setFormState({ status: "loading", message: "" });
      savedAccount = await getAccountByName(formData.accountName);

      let accountId;

      if (!savedAccount) {
        savedAccount = await createAccount(formData.accountName);
        console.log("SAVED ACCOUNT AFTER CREATE: ", savedAccount.createResponse[0]);
        accountId = savedAccount.createResponse[0].Id;
        savedAccount = await createBillingProfile(savedAccount.createResponse[0].Id, formData);
        console.log("SAVED BILLING PROFILE: ", savedAccount.createResponse[0]);
        savedAccount = await getAccountByName(formData.accountName);
        console.log("SAVED ACCOUNT IN THE END: ", savedAccount);
      }

      if (!savedAccount.HostedPaymentPageExternalId) {
        console.error("NO EXTERNAL ID CREATED");
      }

      const roleId = await getRoleByName("CUSTOMER PORTAL USER");
      console.log("Role ID: ", roleId);

      if (roleId) {
        const externalUser =
          await createExternalUser(
            roleId,
            'EN',
            0,
            formData.firstName + formData.lastName,
            accountId,
            "lazar.todic@billingplatform.com");
        console.log("EXTERNAL USER: ", externalUser!);
      }

      setFormState({ status: "", message: "" });
      setStep(formSteps.PAYMENT_DETAILS);
      buildPaymentForm(savedAccount.HostedPaymentPageExternalId, savedAccount.CurrencyCode);
    } catch (e) {
      console.error("ERROR:", e);
      setFormState({ status: "error", message: "API error" });
    }
  };

  const onChangeField = (e) => {
    const copy = { ...formData };
    copy[e.target.name] = e.target.value;
    setFormData(copy);
  };

  const onFieldBlur = (e) => {
    const copy = { ...formData };
    copy[e.target.name] = (copy[e.target.name] || "").trim();
    setFormData(copy);
  };

  return (
    <div>
      {formState.status === "loading" && <Loader />}
      {step !== formSteps.PAYMENT_DETAILS && (
        <div className="billing-contact-form">
          <h2 className="form-header">Your details</h2>
          <span style={{ color: "red" }}>{formState.message}</span>
          <div
            className="form-fields"
            style={step !== formSteps.BILLING_CONTACT ? { opacity: 0.7 } : {}}
          >
            <span className="form-label form-label">Name</span>
            <div className="u-flex form-input name-input">
              <input
                placeholder="First Name"
                name="firstName"
                disabled={step === formSteps.PAYMENT_DETAILS}
                value={formData.firstName}
                onChange={onChangeField}
                onBlur={onFieldBlur}
              />
              <input
                placeholder="Last Name"
                name="lastName"
                disabled={step === formSteps.PAYMENT_DETAILS}
                value={formData.lastName}
                onChange={onChangeField}
              />
            </div>
            <span className="form-label "></span>
            <input
              className="form-input"
              placeholder="Account Name"
              name="accountName"
              disabled={step === formSteps.PAYMENT_DETAILS}
              value={formData.accountName}
              onChange={onChangeField}
            />
            <span className="form-label ">Email address</span>
            <input
              className="form-input"
              placeholder="Email"
              name="email"
              disabled={step === formSteps.PAYMENT_DETAILS}
              value={formData.email}
              onChange={onChangeField}
            />
            <span className="form-label ">Country</span>
            <input
              className="form-input"
              placeholder="Country"
              name="country"
              disabled={step === formSteps.PAYMENT_DETAILS}
              value={formData.country}
              onChange={onChangeField}
            />
            <span className="form-label">State</span>
            <input
              className="form-input"
              placeholder="State"
              name="state"
              disabled={step === formSteps.PAYMENT_DETAILS}
              value={formData.state}
              onChange={onChangeField}
            />
            <span className="form-label ">City</span>
            <input
              className="form-input"
              placeholder="City"
              name="city"
              disabled={step === formSteps.PAYMENT_DETAILS}
              value={formData.city}
              onChange={onChangeField}
            />
            <span className="form-label ">Address</span>
            <input
              className="form-input"
              placeholder="Address"
              name="addr1"
              disabled={step === formSteps.PAYMENT_DETAILS}
              value={formData.addr1}
              onChange={onChangeField}
            />
            <span className="form-label ">Zip</span>
            <input
              className="form-input"
              placeholder="Zip"
              name="zip"
              disabled={step === formSteps.PAYMENT_DETAILS}
              value={formData.zip}
              onChange={onChangeField}
            />
          </div>
          <button
            onClick={onFormSubmit}
            className="plan-card__try-btn step-btn"
            disabled={step === formSteps.PAYMENT_DETAILS}
          >
            Create my account and continue to payment
          </button>
        </div>
      )}
      <div id="payment-form"></div>
    </div>
  );
};

export default PaymentForm;
