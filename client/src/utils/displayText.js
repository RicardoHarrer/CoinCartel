const CATEGORY_TRANSLATIONS = {
  Lebensmittel: "Groceries",
  Miete: "Rent",
  Freizeit: "Leisure",
  Kleidung: "Clothing",
  Transport: "Transport",
  Versicherungen: "Insurance",
  "Strom/Gas": "Utilities",
  "Internet/Telefon": "Internet/Phone",
  Gesundheit: "Health",
  Bildung: "Education",
  Sparen: "Savings",
  Gehalt: "Salary",
  Geschenke: "Gifts",
  Gastronomie: "Dining",
  Sonstiges: "Other",
  Unkategorisiert: "Uncategorized",
};

const TRANSACTION_TYPE_TRANSLATIONS = {
  Einnahme: "Income",
  Ausgabe: "Expense",
  Income: "Income",
  Expense: "Expense",
};

const PAYMENT_METHOD_TRANSLATIONS = {
  Karte: "Card",
  Bar: "Cash",
  "\u00dcberweisung": "Transfer",
  "?berweisung": "Transfer",
  Ueberweisung: "Transfer",
  ueberweisung: "Transfer",
  uberweisung: "Transfer",
  Dauerauftrag: "Standing Order",
  Online: "Online",
  Bank: "Bank",
};

export const toEnglishCategoryName = (name) => {
  const key = String(name || "").trim();
  return CATEGORY_TRANSLATIONS[key] || key || "Uncategorized";
};

export const toEnglishTransactionType = (type) => {
  const key = String(type || "").trim();
  return TRANSACTION_TYPE_TRANSLATIONS[key] || key || "Transaction";
};

export const toEnglishPaymentMethod = (method) => {
  const key = String(method || "").trim();
  return PAYMENT_METHOD_TRANSLATIONS[key] || key;
};
