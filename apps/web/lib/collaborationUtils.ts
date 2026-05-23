export function numericHash(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getUserColor(userId: string): string {
  return `hsl(${numericHash(userId) % 360} 65% 58%)`;
}
