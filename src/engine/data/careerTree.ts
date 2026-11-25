// The career tree: each path groups jobs from entry level to the top so the player can plan a route.
export interface TreeTier { label: string; ids: string[] }
export interface TreePath { id: string; name: string; icon: string; blurb: string; tiers: TreeTier[] }

export const CAREER_TREE: TreePath[] = [
  { id: 'creator', name: 'Creator Economy', icon: '📱', blurb: 'Build an audience, then build a business around it.', tiers: [
    { label: 'Start posting', ids: ['content_creator', 'streamer', 'youtuber', 'podcaster'] },
    { label: 'Craft & niche', ids: ['fl_editor', 'fl_photo', 'social_mgr', 'model', 'dj', 'esports'] },
    { label: 'Behind the scenes', ids: ['talent_agent', 'media_producer', 'pr_mgr'] },
    { label: 'Mogul', ids: ['entrepreneur', 'ceo'] },
  ] },
  { id: 'freelance', name: 'Freelance & Gig', icon: '🧑‍💻', blurb: 'Work for yourself. Great alongside study, and no boss to answer to.', tiers: [
    { label: 'Quick gigs', ids: ['pt_freelance', 'rider', 'ride_hail', 'online_seller'] },
    { label: 'Skilled freelance', ids: ['fl_writer', 'fl_designer', 'fl_dev', 'fl_translator', 'fl_editor'] },
    { label: 'Go bigger', ids: ['consultant', 'entrepreneur'] },
  ] },
  { id: 'student', name: 'While You Study', icon: '🎓', blurb: 'Students can work part-time or freelance, but not full-time.', tiers: [
    { label: 'Part-time', ids: ['pt_retail', 'pt_cafe', 'pt_tutor', 'pt_campus'] },
    { label: 'Experience in your field', ids: ['pt_ra', 'pt_intern', 'pt_freelance'] },
    { label: 'Freelance & creator', ids: ['fl_dev', 'fl_writer', 'fl_designer', 'content_creator'] },
  ] },
  { id: 'tech', name: 'Technology', icon: '💻', blurb: 'From help desk to data science and security.', tiers: [
    { label: 'Entry', ids: ['it_support', 'fl_dev'] },
    { label: 'Professional', ids: ['software_dev', 'data_analyst', 'cyber_analyst'] },
    { label: 'Specialist', ids: ['data_scientist', 'professor'] },
  ] },
  { id: 'business', name: 'Business & Finance', icon: '💼', blurb: 'Sales floors to boardrooms.', tiers: [
    { label: 'Entry', ids: ['sales_rep', 'real_estate', 'accountant'] },
    { label: 'Professional', ids: ['fin_analyst', 'marketing_mgr', 'hr_mgr', 'ops_mgr'] },
    { label: 'Senior', ids: ['banker', 'consultant'] },
    { label: 'Top', ids: ['entrepreneur', 'ceo'] },
  ] },
  { id: 'health', name: 'Healthcare', icon: '🩺', blurb: 'Care, cure and counselling.', tiers: [
    { label: 'Diploma', ids: ['nurse'] },
    { label: 'Degree', ids: ['pharmacist', 'psychologist'] },
    { label: 'Professional degree', ids: ['doctor', 'dentist'] },
  ] },
  { id: 'public', name: 'Law & Public Service', icon: '⚖️', blurb: 'Serve, protect and govern.', tiers: [
    { label: 'Entry', ids: ['security', 'police', 'firefighter', 'soldier', 'civil_servant'] },
    { label: 'Professional', ids: ['lawyer', 'journalist'] },
    { label: 'Leadership', ids: ['politician'] },
  ] },
  { id: 'eng', name: 'Engineering & Science', icon: '⚙️', blurb: 'Build, design and discover.', tiers: [
    { label: 'Degree', ids: ['engineer', 'civil_engineer', 'architect'] },
    { label: 'Research & teaching', ids: ['scientist', 'teacher', 'professor'] },
    { label: 'Flight', ids: ['pilot'] },
  ] },
  { id: 'trades', name: 'Trades & Services', icon: '🔧', blurb: 'Skilled work with your hands.', tiers: [
    { label: 'Start', ids: ['construction', 'driver', 'retail', 'barista', 'farmer'] },
    { label: 'Trained', ids: ['electrician', 'mechanic', 'chef'] },
  ] },
  { id: 'arts', name: 'Arts, Sport & Media', icon: '🎭', blurb: 'Talent, grit and a bit of luck.', tiers: [
    { label: 'Create', ids: ['artist', 'musician', 'writer', 'designer', 'actor'] },
    { label: 'Compete', ids: ['athlete', 'esports'] },
  ] },
];
