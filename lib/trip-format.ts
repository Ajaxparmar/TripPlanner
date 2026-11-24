const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  trailingZeroDisplay: "stripIfInteger",
});
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

export const money = (amount: number) => inr.format(amount / 100);
export const displayDate = (date: string) => dateFormat.format(new Date(date + "T00:00:00Z"));
export const today = () => new Date().toLocaleDateString("sv-SE");
