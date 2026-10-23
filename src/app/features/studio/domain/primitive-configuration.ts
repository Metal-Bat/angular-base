const operations: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  arithmetic: {
    add: 'Add numbers',
    subtract: 'Subtract numbers',
    multiply: 'Multiply numbers',
    divide: 'Divide numbers',
    remainder: 'Remainder',
  },
  number_compare: {
    eq: 'Equal',
    ne: 'Not equal',
    lt: 'Less than',
    lte: 'Less than or equal',
    gt: 'Greater than',
    gte: 'Greater than or equal',
  },
  boolean_logic: {
    and: 'All conditions (AND)',
    or: 'Any condition (OR)',
    not: 'Invert condition (NOT)',
  },
};

/** Display labels are separate from reviewed schemas and canonical enum values. */
export function primitiveChoiceLabels(
  handler: string,
): Readonly<Record<string, string>> {
  return operations[handler] ?? {};
}
