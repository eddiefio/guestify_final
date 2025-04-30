interface Window {
  ApplePaySession?: {
    canMakePayments: () => boolean;
    supportsVersion: (version: number) => boolean;
    STATUS_SUCCESS: number;
    STATUS_FAILURE: number;
    STATUS_INVALID_BILLING_POSTAL_ADDRESS: number;
    STATUS_INVALID_SHIPPING_POSTAL_ADDRESS: number;
    STATUS_INVALID_SHIPPING_CONTACT: number;
    STATUS_PIN_REQUIRED: number;
    STATUS_PIN_INCORRECT: number;
    STATUS_PIN_LOCKOUT: number;
    new (version: number, paymentRequest: ApplePayPaymentRequest): ApplePaySession;
  };
}

interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: {
    label: string;
    amount: string | number;
    type?: string;
  };
  requiredBillingContactFields?: string[];
  requiredShippingContactFields?: string[];
  shippingContact?: ApplePayShippingContact;
  billingContact?: ApplePayBillingContact;
  lineItems?: ApplePayLineItem[];
  shippingMethods?: ApplePayShippingMethod[];
  shippingType?: string;
  applicationData?: string;
  merchantIdentifier?: string;
  supportedCountries?: string[];
}

interface ApplePaySession {
  onvalidatemerchant: (event: any) => void;
  onpaymentauthorized: (event: any) => void;
  onpaymentmethodselected: (event: any) => void;
  onshippingcontactselected: (event: any) => void;
  onshippingmethodselected: (event: any) => void;
  oncancel: (event: any) => void;
  begin: () => void;
  completeMerchantValidation: (merchantSession: any) => void;
  completePaymentMethodSelection: (update: any) => void;
  completeShippingContactSelection: (update: any) => void;
  completeShippingMethodSelection: (update: any) => void;
  completePayment: (result: {status: number, errors?: any[]}) => void;
  abort: () => void;
}

interface ApplePayShippingContact {
  emailAddress?: string;
  familyName?: string;
  givenName?: string;
  phoneNumber?: string;
  postalAddress?: {
    addressLines: string[];
    administrativeArea: string;
    country: string;
    countryCode: string;
    locality: string;
    postalCode: string;
    subAdministrativeArea: string;
    subLocality: string;
  };
}

interface ApplePayBillingContact {
  emailAddress?: string;
  familyName?: string;
  givenName?: string;
  phoneNumber?: string;
  postalAddress?: {
    addressLines: string[];
    administrativeArea: string;
    country: string;
    countryCode: string;
    locality: string;
    postalCode: string;
    subAdministrativeArea: string;
    subLocality: string;
  };
}

interface ApplePayLineItem {
  label: string;
  amount: string | number;
  type?: string;
}

interface ApplePayShippingMethod {
  label: string;
  detail: string;
  amount: string | number;
  identifier: string;
} 