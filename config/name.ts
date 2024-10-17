export function convertNameEmail(email: string) {
  const namePart = email.split("@")[0];

  const safeName = namePart.replace(/[\/\\?%*:|"<>]/g, "");

  return safeName;
}
