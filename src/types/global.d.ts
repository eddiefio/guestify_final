interface Window {
  ApplePaySession?: {
    canMakePayments: () => boolean;
    supportsVersion: (version: number) => boolean;
    new (version: number, paymentRequest: any): any;
  };
} 