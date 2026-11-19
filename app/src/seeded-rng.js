export function createRNG(seed) {
  let s = seed | 0;
  return function next() {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}