export function toApiEnum(value: string): string {
  return value.toLocaleLowerCase('en-US');
}

export function fromApiEnum<T extends string>(
  value: string,
  allowedValues: readonly string[],
): T {
  const normalized = value.toLocaleLowerCase('en-US');
  if (!allowedValues.includes(normalized)) {
    throw new Error(`Unsupported enum value: ${value}`);
  }

  return normalized.toLocaleUpperCase('en-US').replace(/-/g, '_') as T;
}
