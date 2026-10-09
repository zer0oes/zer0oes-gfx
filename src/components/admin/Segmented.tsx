// Choix exclusif présenté en interrupteur à segments (au lieu de boutons radio).
// Fonctionne dans un formulaire classique (defaultValue) ou contrôlé (value + onChange).
export function Segmented({
  name,
  legend,
  options,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  legend?: string;
  options: readonly (readonly [string, string])[]; // [valeur, libellé]
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <fieldset>
      {legend && <legend className="mb-1.5 text-sm font-medium">{legend}</legend>}
      <div className="inline-grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-border bg-background p-1">
        {options.map(([v, label]) => (
          <label
            key={v}
            className="cursor-pointer rounded-full px-4 py-1.5 text-center text-sm font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-accent has-[:checked]:text-background has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
          >
            <input
              type="radio"
              name={name}
              value={v}
              className="sr-only"
              {...(onChange ? { checked: value === v, onChange: () => onChange(v) } : { defaultChecked: defaultValue === v })}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
