export function AmountInput({ name = "amount", label = "Amount (₹)", optional = false }: {
  name?: string;
  label?: string;
  optional?: boolean;
}) {
  return <label>{label}{optional && <span className="optional">Optional</span>}
    <input name={name} inputMode="decimal" placeholder="e.g. 2000" pattern="[0-9]{1,8}(\.[0-9]{1,2})?" required={!optional} />
  </label>;
}
