import { netBreakdown, type FinanceSettings } from "@/lib/finance";
import { depositAmount, formatPrice, orderPrice, type PricingSettings } from "@/lib/pricing";

export type NetCase = { label: string; payments: number[] };

// Cas de vente d'un prix : une fois / acompte + solde, avec ou sans remise logo.
export function priceCases(price: number, s: PricingSettings, withLogo: boolean): NetCase[] {
  const split = (p: number) => {
    const d = depositAmount(p, s);
    return [d, p - d];
  };
  const cases: NetCase[] = [
    { label: "Payé en une fois", payments: [price] },
    { label: `Acompte ${s.depositPercent} % + solde`, payments: split(price) },
  ];
  if (withLogo && s.logoDiscount > 0) {
    const p = orderPrice(price, true, s);
    cases.push(
      { label: "Logo fourni, en une fois", payments: [p] },
      { label: "Logo fourni, acompte + solde", payments: split(p) },
    );
  }
  return cases;
}

const td = "whitespace-nowrap px-3 py-2 text-right";

export function NetTable({ title, cases, finance }: { title: string; cases: NetCase[]; finance: FinanceSettings }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="bg-surface-2 px-3 py-2 text-left font-semibold">{title}</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Cas</th>
            <th className={`${td} font-medium`}>Encaissé HT</th>
            <th className={`${td} font-medium`}>Frais Stripe</th>
            <th className={`${td} font-medium`}>URSSAF</th>
            <th className={`${td} font-medium`}>CFP</th>
            {finance.vlEnabled && <th className={`${td} font-medium`}>Vers. lib.</th>}
            <th className={`${td} font-medium`}>Net pour toi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cases.map((c) => {
            const r = netBreakdown(c.payments, finance);
            return (
              <tr key={c.label}>
                <td className="px-3 py-2">
                  {c.label}
                  {r.transactions > 1 && <span className="ml-1 text-xs text-muted">({r.transactions} paiements)</span>}
                </td>
                <td className={td}>{formatPrice(r.gross)}</td>
                <td className={`${td} text-muted`}>−{formatPrice(r.fees)}</td>
                <td className={`${td} text-muted`}>−{formatPrice(r.urssaf)}</td>
                <td className={`${td} text-muted`}>−{formatPrice(r.cfp)}</td>
                {finance.vlEnabled && <td className={`${td} text-muted`}>−{formatPrice(r.vl)}</td>}
                <td className={`${td} font-semibold`}>
                  {formatPrice(r.net)}
                  <span className="ml-1 text-xs font-normal text-muted">({r.gross ? Math.round((r.net / r.gross) * 100) : 0} %)</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
