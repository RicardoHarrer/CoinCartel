const CATEGORY = {
  LEBENSMITTEL: 1,
  MIETE: 2,
  FREIZEIT: 3,
  KLEIDUNG: 4,
  TRANSPORT: 5,
  VERSICHERUNGEN: 6,
  STROM_GAS: 7,
  INTERNET_TELEFON: 8,
  GESUNDHEIT: 9,
  BILDUNG: 10,
  SPAREN: 11,
  GEHALT: 12,
  GESCHENKE: 13,
  GASTRONOMIE: 14,
  SONSTIGES: 15,
};

const normalize = (value = '') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const RULES = [
  {
    categoryId: CATEGORY.GEHALT,
    patterns: [
      /\b(gehalt|lohn|salary|payroll|wage)\b/,
      /\b(tax credit|working tax credit|benefit)\b/,
    ],
  },
  {
    categoryId: CATEGORY.LEBENSMITTEL,
    patterns: [
      /\b(spar|lidl|aldi|tesco|asda|morrisons|rewe|billa|penny|kaufland|edeka|coop)\b/,
      /\b(centra|dunnes|sainsbury|supervalue)\b/,
      /\b(supermarkt|grocery|groceries|market)\b/,
    ],
  },
  {
    categoryId: CATEGORY.GASTRONOMIE,
    patterns: [
      /\b(mcdonald|burger|pizza|kebab|doner|restaurant|cafe|coffee|bar|takeaway|ubereats|deliveroo)\b/,
    ],
  },
  {
    categoryId: CATEGORY.TRANSPORT,
    patterns: [
      /\b(omv|shell|bp|jet|esso|circle k|tank|fuel|petrol|diesel)\b/,
      /\b(atm withdrawal|taxi|uber|bolt|bus|train|bahn|tfl|parking)\b/,
      /\b(dvla|licence|license)\b/,
    ],
  },
  {
    categoryId: CATEGORY.MIETE,
    patterns: [
      /\b(miete|rent|hausverwaltung|landlord|immobilien)\b/,
      /\b(regenda redwing)\b/,
    ],
  },
  {
    categoryId: CATEGORY.INTERNET_TELEFON,
    patterns: [
      /\b(talktalk|t mobile|telekom|vodafone|o2|ee|internet|telefon|mobile)\b/,
    ],
  },
  {
    categoryId: CATEGORY.VERSICHERUNGEN,
    patterns: [
      /\b(axa|versicherung|insurance|membership|animal friends)\b/,
      /\b(creditreportservic)\b/,
    ],
  },
  {
    categoryId: CATEGORY.FREIZEIT,
    patterns: [
      /\b(netflix|spotify|prime|amazon|gaming|bet|betropolis|broadway gaming)\b/,
      /\b(ebay|google play|virgin games|bingo|butlins|tails com|tailscom)\b/,
      /\b(kino|cinema|event|streaming|hobby|travel|reise|annatar)\b/,
      /\b(harvey norman|laptop direct|parkretail)\b/,
    ],
  },
  {
    categoryId: CATEGORY.KLEIDUNG,
    patterns: [
      /\b(zalando|h m|c a|uniqlo|nike|adidas|clothing|fashion)\b/,
    ],
  },
  {
    categoryId: CATEGORY.STROM_GAS,
    patterns: [
      /\b(strom|gas|energy|utility|utilities|electricity|heating)\b/,
      /\b(e on|eon next)\b/,
    ],
  },
  {
    categoryId: CATEGORY.GESUNDHEIT,
    patterns: [
      /\b(apotheke|pharmacy|arzt|doctor|medical|health|dentist|clinic)\b/,
    ],
  },
  {
    categoryId: CATEGORY.BILDUNG,
    patterns: [
      /\b(udemy|coursera|book|schule|school|university|kurs|course|tuition)\b/,
    ],
  },
  {
    categoryId: CATEGORY.SPAREN,
    patterns: [
      /\b(save the change|sparen|saving|investment|broker|etf|crypto|circle uk trading)\b/,
      /\b(revolut|nude finance|halifax|ulster bank|metrobank|vanquis bank)\b/,
      /\b(oakam limited|morses club|securetrade|cleveleys com)\b/,
      /\b(cashback|outgoing dd|returned dd|returned direct debit)\b/,
    ],
  },
  {
    categoryId: CATEGORY.GESCHENKE,
    patterns: [
      /\b(geschenk|gift|present)\b/,
    ],
  },
];

const autoCategorize = (tx = {}) => {
  const description = String(tx.description || tx.merchant_name || '');
  const normalizedDescription = normalize(description);
  const providerTxCategory = String(
    tx?.meta?.provider_transaction_category || tx.transaction_category || '',
  ).toUpperCase();
  const txCategory = String(tx.transaction_category || '').toUpperCase();
  const amount = Number(tx.amount);

  if (Number.isFinite(amount) && amount > 0 && /\b(salary|payroll|gehalt|lohn|tax credit|benefit)\b/.test(normalizedDescription)) {
    return CATEGORY.GEHALT;
  }

  if (txCategory === 'ATM' || providerTxCategory === 'CPT') {
    return CATEGORY.TRANSPORT;
  }

  if (txCategory === 'TRANSFER' || providerTxCategory === 'TFR') {
    return CATEGORY.SPAREN;
  }

  if (txCategory === 'CASH' || providerTxCategory === 'CSH') {
    return CATEGORY.SPAREN;
  }

  if (Number.isFinite(amount) && amount > 0 && /^(mr|ms|mrs|miss|dr)\s+[a-z]+\s+[a-z]+$/.test(normalizedDescription)) {
    return CATEGORY.SPAREN;
  }

  if (Number.isFinite(amount) && amount > 0 && ['BGC', 'DEP', 'FPI'].includes(providerTxCategory)) {
    return CATEGORY.SPAREN;
  }

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalizedDescription))) {
      return rule.categoryId;
    }
  }

  return CATEGORY.SONSTIGES;
};

export default autoCategorize;
