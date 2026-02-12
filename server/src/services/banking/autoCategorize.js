const autoCategorize = (description = '') => {
  const d = description.toLowerCase();

  if (/(billa|spar|hofer|lidl|penny|dm|bipa)/.test(d)) return 1;
  if (/(miete|hausverwaltung|genossenschaft)/.test(d)) return 2;
  if (/(gehalt|lohn|salary|payroll)/.test(d)) return 3;
  if (/(omv|shell|bp|jet|tank)/.test(d)) return 4;
  if (/(mcdonald|burger|pizza|doner|kebab|restaurant|cafe)/.test(d)) return 5;

  return 9;
};

export default autoCategorize;
