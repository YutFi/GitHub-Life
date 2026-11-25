import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase, Compass, GraduationCap, Heart, Home, Landmark, Plane, Scale } from 'lucide-react';
import { useGame } from '../store/useGame';
import { PageHeader, Tabs } from '../components/ui';
import { ActivitiesPanel } from './panels/Activities';
import { EducationPanel } from './panels/Education';
import { CareerPanel } from './panels/Career';
import { FinancePanel } from './panels/Finance';
import { RelationshipsPanel } from './panels/Relationships';
import { PropertiesPanel } from './panels/Properties';
import { TravelPanel } from './panels/Travel';
import { LawPanel } from './panels/Law';
import { isIncarcerated, jus } from '../engine/justice';

const PANELS = [
  { id: 'activities', label: 'Activities', icon: <Compass size={16} />, el: <ActivitiesPanel /> },
  { id: 'education', label: 'Education', icon: <GraduationCap size={16} />, el: <EducationPanel /> },
  { id: 'career', label: 'Career', icon: <Briefcase size={16} />, el: <CareerPanel /> },
  { id: 'finance', label: 'Finance', icon: <Landmark size={16} />, el: <FinancePanel /> },
  { id: 'relationships', label: 'Relationships', icon: <Heart size={16} />, el: <RelationshipsPanel /> },
  { id: 'properties', label: 'Properties', icon: <Home size={16} />, el: <PropertiesPanel /> },
  { id: 'travel', label: 'Travel', icon: <Plane size={16} />, el: <TravelPanel /> },
  { id: 'law', label: 'Law', icon: <Scale size={16} />, el: <LawPanel /> },
] as const;
type Id = typeof PANELS[number]['id'];

export function Actions() {
  const { panel } = useParams();
  const nav = useNavigate();
  const g = useGame((s) => s.game)!;
  const locked = isIncarcerated(g);
  const j = jus(g.player);
  const shown = locked ? PANELS.filter((p) => p.id === 'law') : PANELS.filter((p) => p.id !== 'law' || j.record.length > 0 || !!j.sentence);
  const cur = (shown.find((p) => p.id === panel) ?? shown[0]);
  return (
    <div>
      <PageHeader title="Life actions" sub={`⚡ ${g.player.energy} energy left this year`} />
      <Tabs<Id> tabs={shown.map((p) => ({ id: p.id, label: p.label, icon: p.icon }))} value={cur.id} onChange={(id) => nav(`/play/actions/${id}`)} />
      <div key={cur.id} className="anim-up">{cur.el}</div>
    </div>
  );
}
