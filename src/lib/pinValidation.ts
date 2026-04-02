const SEQUENTIAL = [
  "012345", "123456", "234567", "345678", "456789", "567890",
  "098765", "987654", "876543", "765432", "654321", "543210",
];

export function validatePin(pin: string): { valid: boolean; error?: string; errorAr?: string } {
  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, error: "PIN must be exactly 6 digits", errorAr: "يجب أن يكون الرمز 6 أرقام بالضبط" };
  }
  if (SEQUENTIAL.includes(pin)) {
    return { valid: false, error: "PIN cannot be sequential (e.g. 123456)", errorAr: "لا يمكن أن يكون الرمز متسلسلاً" };
  }
  if (/^(\d)\1{5}$/.test(pin)) {
    return { valid: false, error: "PIN cannot be all the same digit", errorAr: "لا يمكن أن يكون الرمز نفس الرقم" };
  }
  return { valid: true };
}
