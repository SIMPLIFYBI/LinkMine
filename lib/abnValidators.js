export function normalizeAbn(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length !== 11) return null;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const nums = digits.split("").map((d) => Number(d));
  nums[0] = nums[0] - 1;
  const total = nums.reduce((sum, n, i) => sum + n * weights[i], 0);
  return total % 89 === 0 ? digits : null;
}

export function normalizeAcn(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length !== 9) return null;
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  const body = digits.slice(0, 8).split("").map((d) => Number(d));
  const check = Number(digits[8]);
  const total = body.reduce((sum, n, i) => sum + n * weights[i], 0);
  const remainder = total % 10;
  const calc = (10 - remainder) % 10;
  return calc === check ? digits : null;
}