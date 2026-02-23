// Business configuration for invoices and QR-bills
export const businessConfig = {
  // Company info
  name: "Pierre Biege",
  company: "Läuft.",
  tagline: "Digital Systems & Branding",

  // Address
  street: "Tschangaladongastrasse 3",
  postalCode: "3955",
  city: "Albinen",
  country: "CH",

  // Contact
  phone: "079 853 36 72",
  email: "pierre@laeuft.ch",
  website: "laeuft.ch",

  // Banking (Swiss QR-Bill)
  iban: "CH7280808007850888875", // Without spaces
  ibanFormatted: "CH72 8080 8007 8508 8887 5",
  bank: "Raiffeisenbank Region Leuk",

  // Payment terms
  defaultPaymentDays: 30,
}

// Swiss QR-Bill data generator
export function generateQRBillData(invoice: {
  invoiceNumber: string;
  amount: number;
  debtor?: {
    name: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
}) {
  // Swiss Payment Code format (SPC)
  const lines = [
    "SPC",                                    // QR Type
    "0200",                                   // Version
    "1",                                      // Coding (UTF-8)
    businessConfig.iban,                       // IBAN
    "K",                                      // Address type (K = combined)
    businessConfig.name,                       // Creditor name
    businessConfig.street,                     // Street + number
    `${businessConfig.postalCode} ${businessConfig.city}`, // Postal code + city
    "",                                       // (not used for type K)
    "",                                       // (not used for type K)
    businessConfig.country,                    // Country
    "",                                       // Ultimate creditor (not used)
    "",                                       //
    "",                                       //
    "",                                       //
    "",                                       //
    "",                                       //
    invoice.amount.toFixed(2),                // Amount
    "CHF",                                    // Currency
    invoice.debtor ? "K" : "",                // Debtor address type
    invoice.debtor?.name || "",               // Debtor name
    invoice.debtor?.street || "",             // Debtor street
    invoice.debtor ? `${invoice.debtor.postalCode || ""} ${invoice.debtor.city || ""}`.trim() : "",
    "",                                       //
    "",                                       //
    invoice.debtor?.country || "CH",          // Debtor country
    "NON",                                    // Reference type (NON = no reference)
    "",                                       // Reference
    invoice.invoiceNumber,                    // Unstructured message
    "EPD",                                    // Trailer
    "",                                       // Bill information
  ];

  return lines.join("\n");
}
