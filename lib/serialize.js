// Mongoose Map-type fields can survive .lean() as real Map instances,
// which JSON.stringify turns into `{}`. Normalize to a plain object.
export function mapToObject(value) {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  return value;
}
