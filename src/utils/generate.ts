export function generateRoomId(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  // removed confusing chars: 0,O,1,I

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, (x) => chars[x % chars.length]).join("");
}

export function generatePassword(length = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, (x) => chars[x % chars.length]).join("");
}