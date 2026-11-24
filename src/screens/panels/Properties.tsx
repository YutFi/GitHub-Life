import { useState } from 'react';
import { useGame } from '../../store/useGame';
import { useConfirmSetting, useDo, Row, Notice } from './common';
import { Card, Chip, ConfirmButton, Money, SectionTitle } from '../../components/ui';
import { buyProperty, buyVehicle, carPrice, CAR_NAMES, homePrice, moveHome, PROPERTY_NAMES, rentHome, rentPrice, RENT_NAMES, sellProperty, sellVehicle, toggleRentOut } from '../../engine/finance';

export function PropertiesPanel() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const confirmSetting = useConfirmSetting();
  const [mortgage, setMortgage] = useState(true);
  const [asHome, setAsHome] = useState(true);
  const [financeCar, setFinanceCar] = useState(false);
  const p = g.player; const f = p.fin; const cc = p.countryId;
  const adult = p.age >= 18;
  const home = f.housing;
  const homeLabel = home.kind === 'family' ? 'Living with family' : home.kind === 'rent' ? `Renting · ${RENT_NAMES[home.quality - 1]}` : `Owner · ${f.properties.find((x) => x.id === home.propertyId)?.name ?? 'Your home'}`;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Where you live</SectionTitle>
        <div className="flex flex-wrap items-center gap-2"><b className="text-lg">🏠 {homeLabel}</b><Chip>{p.city}</Chip></div>
        {home.kind !== 'family' && home.kind !== 'own' && <button className="btn btn-sm mt-3" onClick={() => run(moveHome)}>↩ Move back in with family</button>}
      </Card>

      {adult && home.kind !== 'own' && (
        <div>
          <SectionTitle>Rent a home</SectionTitle>
          <div className="space-y-2">
            {RENT_NAMES.map((n, i) => {
              const q = i + 1; const price = rentPrice(g, q); const cur = home.kind === 'rent' && home.quality === q;
              return <Row key={n} icon={['🛏️', '🏢', '🛋️', '🌆'][i]} title={n} sub={<><Money usd={price} country={cc} compact />/year</>} right={cur ? <Chip tone="good">Current</Chip> : <button className="btn btn-primary btn-sm" onClick={() => run((x) => rentHome(x, q))}>Move in</button>} />;
            })}
          </div>
          <p className="mt-2 text-xs text-muted">Moving in requires a deposit of a quarter of a year's rent.</p>
        </div>
      )}

      {adult && (
        <div>
          <SectionTitle>Buy property</SectionTitle>
          <Card className="mb-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mortgage} onChange={(e) => setMortgage(e.target.checked)} /> Use a mortgage</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={asHome} onChange={(e) => setAsHome(e.target.checked)} /> Live there (otherwise rent it out)</label>
          </Card>
          <div className="space-y-2">
            {PROPERTY_NAMES.map((n, i) => {
              const price = homePrice(g, i);
              return <Row key={n} icon={['🏙️', '🏘️', '🏡', '🏰'][i]} title={n} sub={<>Price <Money usd={price} country={cc} compact />{mortgage ? ' · 10–20% down' : ' · paid in cash'}</>} right={<button className="btn btn-primary btn-sm" onClick={() => run((x) => buyProperty(x, i, mortgage, asHome))}>Buy</button>} />;
            })}
          </div>
        </div>
      )}

      {f.properties.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Your properties</SectionTitle>
          {f.properties.map((pr) => (
            <Row key={pr.id} icon="🏠" title={pr.name} sub={<>{pr.city} · bought at {pr.boughtAge} for <Money usd={pr.bought} country={cc} compact /> · worth <b><Money usd={pr.value} country={cc} compact /></b></>}
              right={<>{pr.home ? <Chip tone="good">Home</Chip> : <button className="btn btn-sm" onClick={() => run((x) => toggleRentOut(x, pr.id))}>{pr.rented ? 'Stop renting out' : 'Rent out'}</button>}
                <ConfirmButton title={`Sell ${pr.name}?`} body="You receive its market value minus fees and repay any mortgage." confirmLabel="Sell" skip={!confirmSetting} onConfirm={() => run((x) => sellProperty(x, pr.id))}>Sell</ConfirmButton></>}>
              {pr.rented && <Chip tone="info" className="self-start">Earning rent</Chip>}
            </Row>
          ))}
        </div>
      )}

      {adult ? (
        <div>
          <SectionTitle>Vehicles</SectionTitle>
          <Card className="mb-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={financeCar} onChange={(e) => setFinanceCar(e.target.checked)} /> Finance with an auto loan</label></Card>
          <div className="space-y-2">
            {CAR_NAMES.map((n, i) => <Row key={n} icon={['🚙', '🚗', '🚐', '🏎️', '🏁'][i]} title={n} sub={<>Price <Money usd={carPrice(g, i)} country={cc} compact /></>} right={<button className="btn btn-primary btn-sm" onClick={() => run((x) => buyVehicle(x, i, financeCar))}>Buy</button>} />)}
          </div>
          {f.vehicles.length > 0 && <div className="mt-3 space-y-2">{f.vehicles.map((v) => <Row key={v.id} icon="🚗" title={v.name} sub={<>Bought at {v.boughtAge} · worth <Money usd={v.value} country={cc} compact /> (cars lose value)</>} right={<ConfirmButton title={`Sell ${v.name}?`} body="You'll receive its current market value." confirmLabel="Sell" skip={!confirmSetting} onConfirm={() => run((x) => sellVehicle(x, v.id))}>Sell</ConfirmButton>} />)}</div>}
        </div>
      ) : <Notice>Property and vehicles unlock at age 18.</Notice>}
    </div>
  );
}
