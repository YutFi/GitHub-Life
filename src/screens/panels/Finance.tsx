import { useState } from 'react';
import { useGame } from '../../store/useGame';
import { useConfirmSetting, useDo, Row, Notice } from './common';
import { AmountInput, Card, ConfirmButton, KV, Money, SectionTitle, Segmented, Slider } from '../../components/ui';
import { LineChart } from '../../components/Chart';
import { fmtMoney } from '../../engine/format';
import { cashAdvance, creditLimit, declareBankruptcy, deposit, donate, expenseBreakdown, invest, loanRate, maxPersonalLoan, payCard, playLottery, repayLoan, sellHolding, setContribution, setLifestyle, setWill, takeLoan, withdraw, annualIncomeEstimate } from '../../engine/finance';
import type { Holding, Lifestyle } from '../../engine/types';
import { netWorth } from '../../engine/util';

const TABS = ['Overview', 'Bank', 'Invest', 'Loans & cards', 'Lifestyle & will'] as const;
type Tab = typeof TABS[number];
const KIND: Record<Holding['kind'], { name: string; icon: string; desc: string }> = {
  index: { name: 'Index fund', icon: '📊', desc: 'Diversified, steady long-term growth.' },
  stocks: { name: 'Stocks', icon: '📈', desc: 'Higher highs and lower lows.' },
  bonds: { name: 'Bonds', icon: '🧾', desc: 'Low risk, modest return.' },
  crypto: { name: 'Crypto', icon: '🪙', desc: 'Wild swings. Could multiply or vanish.' },
};
const LIFESTYLES: { v: Lifestyle; label: string; hint: string }[] = [
  { v: 'frugal', label: 'Frugal', hint: 'Spend less, enjoy a little less.' },
  { v: 'normal', label: 'Normal', hint: 'Balanced spending.' },
  { v: 'comfortable', label: 'Comfortable', hint: 'Nicer things, higher bills.' },
  { v: 'luxury', label: 'Luxury', hint: 'Premium everything. Expensive.' },
];
const CHARITY = ['None', '10% to charity', '25% to charity', '50% to charity'];

export function FinancePanel() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const confirmSetting = useConfirmSetting();
  const [tab, setTab] = useState<Tab>('Overview');
  const [amt, setAmt] = useState(0);
  const [years, setYears] = useState(5);
  const p = g.player; const f = p.fin; const cc = p.countryId;
  const adult = p.age >= 18;
  const nw = netWorth(g);
  const invTotal = f.holdings.reduce((s, h) => s + h.value, 0);
  const debt = f.loans.reduce((s, l) => s + l.balance, 0) + f.card.balance;
  const rep = f.lastReport;
  const exp = expenseBreakdown(g);
  const expTotal = Object.values(exp).reduce((s, v) => s + v, 0);
  const incTotal = rep ? Object.values(rep.income).reduce((s, v) => s + v, 0) : 0;
  const amountBox = <AmountInput key={tab} country={cc} usd={amt} onChange={setAmt} label="Amount" quick={[100, 1000, 10000].map((n) => Math.round(n * g.world.priceIndex))} />;

  return (
    <div className="space-y-4">
      <div className="-mx-1 overflow-x-auto px-1"><Segmented size="sm" value={tab} onChange={(t) => { setTab(t); setAmt(0); }} options={TABS.map((t) => ({ value: t, label: t }))} /></div>

      {tab === 'Overview' && (
        <>
          <Card>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Net worth</div>
            <div className="mb-2 text-3xl font-extrabold tabular-nums"><Money usd={nw} country={cc} /></div>
            <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
              <KV k="Cash" v={<Money usd={f.cash} country={cc} compact />} /><KV k="Savings" v={<Money usd={f.savings} country={cc} compact />} /><KV k="Investments" v={<Money usd={invTotal} country={cc} compact />} />
              <KV k="Retirement" v={<Money usd={f.retirement} country={cc} compact />} /><KV k="Property" v={<Money usd={f.properties.reduce((s, x) => s + x.value, 0)} country={cc} compact />} /><KV k="Vehicles" v={<Money usd={f.vehicles.reduce((s, x) => s + x.value, 0)} country={cc} compact />} />
              <KV k="Debt" v={<span className={debt ? 'text-bad' : ''}><Money usd={debt} country={cc} compact /></span>} /><KV k="Credit score" v={f.creditScore} /><KV k="Est. income" v={<Money usd={annualIncomeEstimate(g)} country={cc} compact />} />
            </div>
          </Card>
          {p.history.length > 1 && <Card><SectionTitle>Net worth over time</SectionTitle><LineChart series={[{ name: 'Net worth', color: 'var(--brand2)', area: true, points: p.history.map((h) => ({ x: h.age, y: h.netWorth })) }]} yFormat={(v) => fmtMoney(v, cc, true)} /></Card>}
          <Card>
            <SectionTitle>{rep ? `Last year (age ${rep.age})` : 'Annual budget'}</SectionTitle>
            {rep ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div><div className="mb-1 text-xs font-semibold uppercase text-muted">Income · <Money usd={incTotal} country={cc} compact /></div>
                  {Object.entries(rep.income).filter(([, v]) => v > 0).map(([k, v]) => <KV key={k} k={k[0].toUpperCase() + k.slice(1)} v={<Money usd={v} country={cc} compact />} />)}
                  <KV k="Income tax & payroll" v={<span className="text-bad">−<Money usd={rep.tax} country={cc} compact /></span>} /></div>
                <div><div className="mb-1 text-xs font-semibold uppercase text-muted">Spending · <Money usd={Object.values(rep.expenses).reduce((s, v) => s + v, 0)} country={cc} compact /></div>
                  {Object.entries(rep.expenses).filter(([, v]) => v > 0).map(([k, v]) => <KV key={k} k={k[0].toUpperCase() + k.slice(1)} v={<Money usd={v} country={cc} compact />} />)}</div>
              </div>
            ) : <p className="text-sm text-muted">Your first yearly report appears after you age up once.</p>}
            <div className="mt-3 rounded-2xl bg-black/10 p-3 text-sm"><span className="text-muted">Projected costs this year:</span> <b><Money usd={expTotal} country={cc} compact /></b></div>
          </Card>
          <Card>
            <SectionTitle>Retirement fund</SectionTitle>
            <KV k="Balance" v={<Money usd={f.retirement} country={cc} />} />
            {adult ? <Slider label="Contribution (% of salary)" value={f.contrib} min={0} max={20} step={1} onChange={(v) => run((x) => setContribution(x, v), { quiet: true })} format={(v) => `${v}%`} /> : <p className="text-sm text-muted">Available from age 18.</p>}
          </Card>
        </>
      )}

      {tab === 'Bank' && (
        <Card className="space-y-3">
          <KV k="Cash on hand" v={<Money usd={f.cash} country={cc} />} /><KV k="Savings account" v={<Money usd={f.savings} country={cc} />} />
          {adult || p.age >= 12 ? (
            <>
              {amountBox}
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-primary btn-sm" disabled={amt <= 0} onClick={() => run((x) => deposit(x, amt))}>⬇ Deposit to savings</button>
                <button className="btn btn-sm" disabled={amt <= 0} onClick={() => run((x) => withdraw(x, amt))}>⬆ Withdraw to cash</button>
              </div>
              <p className="text-xs text-muted">Savings earn interest ({(g.world.interest * 100).toFixed(1)}% right now) but are shielded from none of inflation. Cash earns nothing.</p>
            </>
          ) : <p className="text-sm text-muted">Banking opens at age 12.</p>}
        </Card>
      )}

      {tab === 'Invest' && (
        <>
          {adult ? (
            <Card className="space-y-3">
              {amountBox}
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(KIND) as Holding['kind'][]).map((k) => (
                  <button key={k} className="btn !flex-col !items-start !rounded-2xl !p-3 text-left" disabled={amt <= 0} onClick={() => run((x) => invest(x, k, amt))}>
                    <span className="font-semibold">{KIND[k].icon} Buy {KIND[k].name}</span><span className="text-xs font-normal text-muted">{KIND[k].desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">Investments are paid from cash. Last year the stock market returned {(g.world.stockReturn * 100).toFixed(1)}%. Past results never guarantee the future.</p>
            </Card>
          ) : <Notice>Investing opens at age 18.</Notice>}
          {f.holdings.length > 0 && (
            <div className="space-y-2">
              <SectionTitle>Your portfolio · <Money usd={invTotal} country={cc} compact /></SectionTitle>
              {f.holdings.map((h) => {
                const gain = h.value - h.basis;
                return (
                  <Row key={h.id} icon={KIND[h.kind].icon} title={KIND[h.kind].name} sub={<>Invested <Money usd={h.basis} country={cc} compact /> · <span className={gain >= 0 ? 'text-good' : 'text-bad'}><Money usd={gain} country={cc} compact signed /></span></>}
                    right={<><b className="text-sm"><Money usd={h.value} country={cc} compact /></b><button className="btn btn-sm" disabled={amt <= 0} onClick={() => run((x) => sellHolding(x, h.id, Math.min(amt, h.value)))}>Sell amount</button><button className="btn btn-sm" onClick={() => run((x) => sellHolding(x, h.id, 'all'))}>Sell all</button></>} />
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'Loans & cards' && (
        <>
          {adult ? (
            <Card className="space-y-3">
              <SectionTitle>Borrow</SectionTitle>
              {amountBox}
              <div><label className="mb-1 block text-xs font-semibold text-muted">Term: {years} years · rate ≈ {(loanRate(g, 'personal') * 100).toFixed(1)}%</label><input type="range" min={1} max={15} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-[var(--brand)]" aria-label="Loan term in years" /></div>
              <div className="flex flex-wrap items-center gap-2"><button className="btn btn-primary btn-sm" disabled={amt <= 0} onClick={() => run((x) => takeLoan(x, amt, years))}>🏦 Take loan</button><span className="text-xs text-muted">Up to <Money usd={maxPersonalLoan(g)} country={cc} compact /></span></div>
            </Card>
          ) : <Notice>Borrowing opens at age 18.</Notice>}
          {f.loans.length > 0 && (
            <div className="space-y-2"><SectionTitle>Loans</SectionTitle>
              {f.loans.map((l) => (
                <Row key={l.id} icon={l.kind === 'mortgage' ? '🏠' : l.kind === 'student' ? '🎓' : l.kind === 'auto' ? '🚗' : '🏦'} title={l.name} sub={<>{(l.rate * 100).toFixed(1)}% · pays <Money usd={l.payment} country={cc} compact />/yr</>}
                  right={<><b className="text-sm text-bad"><Money usd={l.balance} country={cc} compact /></b><button className="btn btn-sm" disabled={amt <= 0} onClick={() => run((x) => repayLoan(x, l.id, Math.min(amt, l.balance)))}>Pay amount</button><button className="btn btn-sm" onClick={() => run((x) => repayLoan(x, l.id, 'all'))}>Pay off</button></>} />
              ))}
            </div>
          )}
          <Card className="space-y-2">
            <SectionTitle>Credit card</SectionTitle>
            {f.card.limit > 0 ? (
              <>
                <KV k="Balance" v={<span className={f.card.balance ? 'text-bad' : ''}><Money usd={f.card.balance} country={cc} /></span>} /><KV k="Limit" v={<Money usd={f.card.limit} country={cc} compact />} /><KV k="Credit score" v={f.creditScore} />
                <div className="flex flex-wrap gap-2 pt-1"><button className="btn btn-sm" disabled={f.card.balance <= 0} onClick={() => run((x) => payCard(x, 'all'))}>Pay in full</button><button className="btn btn-sm" disabled={amt <= 0 || f.card.balance <= 0} onClick={() => run((x) => payCard(x, amt))}>Pay amount</button><button className="btn btn-sm" disabled={amt <= 0} onClick={() => run((x) => cashAdvance(x, amt))}>Cash advance</button></div>
                <p className="text-xs text-muted">Cards charge steep interest on unpaid balances. Cash advances are expensive. Credit limit now <Money usd={creditLimit(g)} country={cc} compact />.</p>
              </>
            ) : <p className="text-sm text-muted">{adult ? 'You will be offered a credit card once you have an income.' : 'Cards are available from age 18.'}</p>}
          </Card>
          {adult && debt > 0 && f.cash + f.savings < debt * 0.1 && (
            <Card><SectionTitle>Overwhelmed by debt?</SectionTitle><p className="mb-2 text-sm text-muted">Bankruptcy wipes your debts and assets but wrecks your credit for years. {f.bankruptcies > 0 ? `You have declared bankruptcy ${f.bankruptcies} time(s).` : ''}</p>
              <ConfirmButton className="btn btn-danger btn-sm" title="Declare bankruptcy?" body="Your debts are cleared, but you lose most assets and your credit score collapses. This is a last resort." confirmLabel="Declare bankruptcy" skip={!confirmSetting} onConfirm={() => run(declareBankruptcy)}>⚖️ Declare bankruptcy</ConfirmButton></Card>
          )}
        </>
      )}

      {tab === 'Lifestyle & will' && (
        <>
          <Card className="space-y-3">
            <SectionTitle>Lifestyle</SectionTitle>
            <Segmented size="sm" value={f.lifestyle} onChange={(v) => run((x) => setLifestyle(x, v), { quiet: true })} options={LIFESTYLES.map((l) => ({ value: l.v, label: l.label }))} />
            <p className="text-xs text-muted">{LIFESTYLES.find((l) => l.v === f.lifestyle)?.hint} A more lavish lifestyle lifts happiness and looks but quickly eats your income.</p>
          </Card>
          {adult && (
            <Card className="space-y-3"><SectionTitle>Give & gamble</SectionTitle>
              {amountBox}
              <div className="flex flex-wrap gap-2"><button className="btn btn-sm" disabled={amt <= 0} onClick={() => run((x) => donate(x, amt))}>🎗️ Donate</button><button className="btn btn-sm" onClick={() => run(playLottery)}>🎟️ Buy a lottery ticket</button></div>
              <p className="text-xs text-muted">Donated so far: <Money usd={f.donated * g.world.priceIndex} country={cc} compact />. Lottery tickets played: {f.lottery}. The odds are terrible.</p>
            </Card>
          )}
          <Card className="space-y-3">
            <SectionTitle>Your will</SectionTitle>
            <p className="text-sm text-muted">When you die, debts and inheritance tax are settled first. Then your wishes are carried out.</p>
            <div><div className="mb-1 text-xs font-semibold text-muted">Donate to charity</div><Segmented size="sm" value={p.willCharity} onChange={(v) => run((x) => setWill(x, v, p.willMode), { quiet: true })} options={CHARITY.map((c, i) => ({ value: i, label: c }))} /></div>
            <div><div className="mb-1 text-xs font-semibold text-muted">Heirs</div><Segmented size="sm" value={p.willMode} onChange={(v) => run((x) => setWill(x, p.willCharity, v), { quiet: true })} options={[{ value: 'equal', label: 'Split equally' }, { value: 'eldest', label: 'Eldest inherits most' }]} /></div>
          </Card>
        </>
      )}
    </div>
  );
}
