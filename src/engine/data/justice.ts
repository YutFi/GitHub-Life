// Country-flavoured justice systems. Names are inspired by each country's real institutions, simplified for play.

export type Program = 'School classes' | 'Vocational workshops' | 'Religious classes' | 'Counselling' | 'Prison industries' | 'Sports' | 'Drug treatment';

export interface Facility {
  id: string;
  name: string;
  kind: 'juvenile' | 'rehab' | 'prison';
  blurb: string;
  /** 0..10: how dangerous daily life is */
  violence: number;
  programs: Program[];
}

export interface JusticeSystem {
  /** minimum age of criminal responsibility */
  criminalAge: number;
  /** under this age you go through the juvenile system */
  juvenileMax: number;
  /** young-offender institutions take people up to (below) this age, if the country has them */
  youngAdultMax?: number;
  juvenileCourt: string;
  adultCourt: string;
  police: string;
  juvenile: { light: Facility; heavy: Facility };
  youngAdult?: Facility;
  adult: { low: Facility; mid: Facility; high: Facility };
  drug: Facility;
  /** share of a sentence actually served when conduct is good */
  release: { frac: number; label: string };
  probation: string;
  community: string;
  caning?: boolean;
  /** short lines of daily-life colour */
  life: string[];
}

const F = (id: string, name: string, kind: Facility['kind'], violence: number, blurb: string, programs: Program[]): Facility => ({ id, name, kind, violence, blurb, programs });

const std = (p: Program[]) => p;

export const JUSTICE: Record<string, JusticeSystem> = {
  my: {
    criminalAge: 10, juvenileMax: 18, youngAdultMax: 21,
    juvenileCourt: 'Mahkamah Kanak-Kanak (Court for Children)', adultCourt: 'Mahkamah Sesyen (Sessions Court)', police: 'Polis Diraja Malaysia',
    juvenile: {
      light: F('my_tunas', 'Sekolah Tunas Bakti (approved school)', 'juvenile', 2, 'A Social Welfare Department approved school for youths with behavioural problems or minor offences, with classes, skills training and religious guidance.', std(['School classes', 'Vocational workshops', 'Religious classes', 'Counselling'])),
      heavy: F('my_shg', 'Sekolah Henry Gurney (Prisons Department rehabilitation school)', 'juvenile', 4, 'For serious juvenile offenders aged 14 and up. Strict routine, uniforms and early-morning drills alongside schooling, vocational training and character building.', std(['School classes', 'Vocational workshops', 'Religious classes', 'Counselling', 'Sports'])),
    },
    youngAdult: F('my_integriti', 'Sekolah Integriti (young prisoners)', 'prison', 5, 'Young prisoners aged 15 to 21, kept apart from adult inmates, with schooling and skills programmes.', std(['School classes', 'Vocational workshops', 'Religious classes', 'Counselling'])),
    adult: {
      low: F('my_sbuloh', 'Penjara Sungai Buloh', 'prison', 5, 'A large prison near Kuala Lumpur, crowded dormitory-style cells and daily roll calls.', std(['Vocational workshops', 'Religious classes', 'Prison industries', 'Counselling'])),
      mid: F('my_kajang', 'Penjara Kajang', 'prison', 6, 'A major prison in Selangor with workshops, a prison industries programme and a strict timetable.', std(['Vocational workshops', 'Religious classes', 'Prison industries', 'Counselling'])),
      high: F('my_taiping', 'Penjara Taiping (maximum security)', 'prison', 8, 'A historic, high-security prison. Tight control, little freedom and long days in the cell.', std(['Religious classes', 'Prison industries', 'Counselling'])),
    },
    drug: F('my_aadk', 'Pusat Pemulihan Dadah (Cure & Care rehabilitation centre)', 'rehab', 3, 'A residential drug rehabilitation centre run by the National Anti-Drugs Agency, with treatment, counselling and vocational skills.', std(['Drug treatment', 'Counselling', 'Vocational workshops', 'Religious classes'])),
    release: { frac: 0.67, label: 'one-third remission for good conduct' },
    probation: 'Probation order under the Probation of Offenders Act', community: 'Community service order', caning: true,
    life: ['Wake-up call before dawn, then roll call and breakfast.', 'Friday prayers and religious classes fill part of the week.', 'The workshop smells of sawdust and varnish.'],
  },
  sg: {
    criminalAge: 10, juvenileMax: 16, youngAdultMax: 21,
    juvenileCourt: 'Youth Court', adultCourt: 'State Courts', police: 'Singapore Police Force',
    juvenile: {
      light: F('sg_boys', 'Singapore Boys\' / Girls\' Home (juvenile rehabilitation centre)', 'juvenile', 2, 'A residential home run by social services, with school, counselling and structured routines.', std(['School classes', 'Counselling', 'Vocational workshops', 'Sports'])),
      heavy: F('sg_boys2', 'Singapore Boys\' Home (closed regime)', 'juvenile', 4, 'A tighter regime for youths who need closer supervision.', std(['School classes', 'Counselling', 'Vocational workshops'])),
    },
    youngAdult: F('sg_rtc', 'Reformative Training Centre', 'prison', 5, 'For offenders aged 16 to 20. A long, structured programme of discipline, education and aftercare.', std(['School classes', 'Vocational workshops', 'Counselling', 'Sports'])),
    adult: {
      low: F('sg_tm', 'Tanah Merah Prison', 'prison', 4, 'A modern, orderly prison with work programmes through the Singapore Corporation of Rehabilitative Enterprises.', std(['Prison industries', 'Vocational workshops', 'Counselling'])),
      mid: F('sg_aw', 'Admiralty West Prison', 'prison', 5, 'A medium-security prison built around structured work and rehabilitation.', std(['Prison industries', 'Vocational workshops', 'Counselling'])),
      high: F('sg_changi', 'Changi Prison Complex', 'prison', 7, 'The country\'s main prison complex. Strict discipline and tight security.', std(['Prison industries', 'Counselling'])),
    },
    drug: F('sg_drc', 'Drug Rehabilitation Centre', 'rehab', 3, 'A supervised programme of treatment, discipline and urine tests for drug abusers.', std(['Drug treatment', 'Counselling', 'Vocational workshops'])),
    release: { frac: 0.67, label: 'one-third remission for good conduct' },
    probation: 'Probation order', community: 'Community work order', caning: true,
    life: ['Everything runs to the minute, from lights-out to inspection.', 'Work orders from the prison industries keep the days full.', 'Counsellors check in on your progress every few weeks.'],
  },
  us: {
    criminalAge: 7, juvenileMax: 18,
    juvenileCourt: 'Juvenile Court', adultCourt: 'Criminal Court', police: 'police',
    juvenile: {
      light: F('us_juvhall', 'County juvenile hall', 'juvenile', 3, 'Short-term youth detention with school hours and counsellors.', std(['School classes', 'Counselling', 'Sports'])),
      heavy: F('us_youthcorr', 'State youth correctional facility', 'juvenile', 6, 'A secure state facility for serious juvenile offenders.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    },
    adult: {
      low: F('us_jail', 'County jail', 'prison', 5, 'Crowded cells and short stays, with limited programmes.', std(['Counselling', 'Religious classes'])),
      mid: F('us_state', 'State prison', 'prison', 7, 'Tiered housing, yard time and work assignments.', std(['School classes', 'Vocational workshops', 'Prison industries', 'Religious classes'])),
      high: F('us_max', 'Maximum-security prison', 'prison', 9, 'Cells for most of the day, tight control, and a rough crowd.', std(['Religious classes', 'Counselling'])),
    },
    drug: F('us_drugct', 'Court-ordered drug treatment programme', 'rehab', 2, 'A residential or outpatient programme in place of a sentence.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.85, label: 'good-time credits and parole' },
    probation: 'Probation', community: 'Community service',
    life: ['Count times and chow lines mark the day.', 'The yard is its own world with its own rules.', 'Commissary day is the highlight of the week.'],
  },
  gb: {
    criminalAge: 10, juvenileMax: 18, youngAdultMax: 21,
    juvenileCourt: 'Youth Court', adultCourt: 'Crown Court', police: 'police',
    juvenile: {
      light: F('gb_sch', 'Secure Children\'s Home', 'juvenile', 3, 'Small, staffed units for the youngest offenders, with education and care.', std(['School classes', 'Counselling', 'Sports'])),
      heavy: F('gb_stc', 'Secure Training Centre', 'juvenile', 5, 'A secure centre for young people with a full education timetable.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    },
    youngAdult: F('gb_yoi', 'Young Offender Institution', 'prison', 6, 'For 18 to 20-year-olds, with education, gym and work.', std(['School classes', 'Vocational workshops', 'Sports', 'Counselling'])),
    adult: {
      low: F('gb_catc', 'Category C prison', 'prison', 5, 'A training prison with workshops and education.', std(['School classes', 'Vocational workshops', 'Prison industries', 'Counselling'])),
      mid: F('gb_catb', 'Category B prison', 'prison', 7, 'A local prison with a busy, noisy wing and limited out-of-cell time.', std(['School classes', 'Vocational workshops', 'Religious classes'])),
      high: F('gb_cata', 'Category A prison', 'prison', 8, 'High security, strict rules and constant observation.', std(['Religious classes', 'Counselling'])),
    },
    drug: F('gb_drr', 'Drug Rehabilitation Requirement', 'rehab', 2, 'Treatment programme ordered by the court, with regular testing.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.5, label: 'automatic early release on licence' },
    probation: 'Community order with probation supervision', community: 'Unpaid work requirement',
    life: ['Banged up for most of the day, with association time on the wing.', 'The servery queue is where news travels.', 'Education block classes give you somewhere to be.'],
  },
  ca: {
    criminalAge: 12, juvenileMax: 18,
    juvenileCourt: 'Youth Justice Court', adultCourt: 'Provincial Court', police: 'police',
    juvenile: {
      light: F('ca_open', 'Open custody youth centre', 'juvenile', 2, 'A group-home setting with school and supervised activities.', std(['School classes', 'Counselling', 'Sports'])),
      heavy: F('ca_secure', 'Secure custody youth centre', 'juvenile', 5, 'A locked youth facility with school and programmes.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    },
    adult: {
      low: F('ca_prov', 'Provincial jail', 'prison', 5, 'Shorter sentences in a busy provincial facility.', std(['School classes', 'Counselling'])),
      mid: F('ca_fedmed', 'Federal medium-security institution', 'prison', 6, 'Longer sentences with programmes and work.', std(['School classes', 'Vocational workshops', 'Prison industries', 'Counselling'])),
      high: F('ca_fedmax', 'Federal maximum-security institution', 'prison', 8, 'Tight control and limited movement.', std(['Counselling', 'Religious classes'])),
    },
    drug: F('ca_dtc', 'Drug Treatment Court programme', 'rehab', 2, 'Supervised treatment in place of a sentence.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.67, label: 'statutory release at two-thirds' },
    probation: 'Probation', community: 'Community service order',
    life: ['Meals, count, work, count. Repeat.', 'Elders and chaplains visit the unit weekly.', 'A cold wind sweeps the yard in winter.'],
  },
  au: {
    criminalAge: 10, juvenileMax: 18,
    juvenileCourt: 'Children\'s Court', adultCourt: 'Magistrates\' Court', police: 'police',
    juvenile: {
      light: F('au_ycc', 'Youth justice community centre', 'juvenile', 2, 'Supervised programmes and school with a lighter regime.', std(['School classes', 'Counselling', 'Sports'])),
      heavy: F('au_jdc', 'Juvenile detention centre', 'juvenile', 5, 'Secure detention with education, counselling and work.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    },
    adult: {
      low: F('au_min', 'Minimum-security correctional centre', 'prison', 3, 'Lower security with work outside the wall.', std(['Vocational workshops', 'Prison industries', 'Counselling'])),
      mid: F('au_med', 'Medium-security correctional centre', 'prison', 6, 'A secure centre with a regular working day.', std(['School classes', 'Vocational workshops', 'Prison industries'])),
      high: F('au_max', 'Maximum-security correctional centre', 'prison', 8, 'High walls and little freedom.', std(['Counselling', 'Religious classes'])),
    },
    drug: F('au_drugct', 'Drug Court programme', 'rehab', 2, 'Treatment and supervision for drug-related offending.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.6, label: 'parole after the non-parole period' },
    probation: 'Community corrections order', community: 'Community work',
    life: ['Heat and dust in the exercise yard.', 'Muster and meals set the rhythm of the day.', 'The library trolley is your lifeline.'],
  },
  de: {
    criminalAge: 14, juvenileMax: 18, youngAdultMax: 21,
    juvenileCourt: 'Jugendgericht (juvenile court)', adultCourt: 'Amtsgericht', police: 'Polizei',
    juvenile: {
      light: F('de_arrest', 'Jugendarrest (short youth detention)', 'juvenile', 2, 'A short, educational stay meant as a wake-up call.', std(['Counselling', 'School classes'])),
      heavy: F('de_jsa', 'Jugendstrafanstalt (juvenile prison)', 'juvenile', 5, 'Prison for young offenders, built around school and vocational training.', std(['School classes', 'Vocational workshops', 'Counselling', 'Sports'])),
    },
    youngAdult: F('de_jsa2', 'Jugendstrafanstalt (young adult unit)', 'prison', 5, 'Education-focused custody for young adults.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    adult: {
      low: F('de_open', 'Offener Vollzug (open prison)', 'prison', 2, 'Open regime: you may work outside during the day.', std(['Vocational workshops', 'Prison industries', 'Counselling'])),
      mid: F('de_jva', 'Justizvollzugsanstalt (JVA)', 'prison', 5, 'A standard prison with work, training and organised leisure.', std(['School classes', 'Vocational workshops', 'Prison industries', 'Counselling'])),
      high: F('de_jva2', 'JVA (high security)', 'prison', 7, 'Secure wing with close supervision.', std(['Counselling', 'Religious classes'])),
    },
    drug: F('de_entz', 'Entziehungsanstalt (treatment institution)', 'rehab', 3, 'Court-ordered addiction treatment.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.67, label: 'release on probation after two-thirds' },
    probation: 'Bewährung (suspended sentence)', community: 'Gemeinnützige Arbeit',
    life: ['Prison work is paid, and rehabilitation is the stated goal.', 'Order and cleanliness rule the wing.', 'Social workers help plan your release.'],
  },
  fr: {
    criminalAge: 13, juvenileMax: 18,
    juvenileCourt: 'Tribunal pour enfants', adultCourt: 'Tribunal correctionnel', police: 'police',
    juvenile: {
      light: F('fr_cef', 'Centre éducatif fermé', 'juvenile', 3, 'A closed educational centre with intensive supervision and schooling.', std(['School classes', 'Vocational workshops', 'Counselling'])),
      heavy: F('fr_epm', 'Établissement pénitentiaire pour mineurs', 'juvenile', 5, 'A prison for minors with teachers and educators on staff.', std(['School classes', 'Vocational workshops', 'Counselling', 'Sports'])),
    },
    adult: {
      low: F('fr_cd', 'Centre de détention', 'prison', 4, 'For longer sentences, with a focus on reintegration.', std(['School classes', 'Vocational workshops', 'Prison industries'])),
      mid: F('fr_ma', 'Maison d\'arrêt', 'prison', 7, 'An overcrowded remand and short-sentence prison.', std(['School classes', 'Religious classes'])),
      high: F('fr_mc', 'Maison centrale', 'prison', 8, 'Highest security, for the most dangerous inmates.', std(['Counselling', 'Religious classes'])),
    },
    drug: F('fr_cure', 'Cure ordered by the court', 'rehab', 2, 'Addiction treatment under judicial supervision.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.67, label: 'sentence adjustment (aménagement de peine)' },
    probation: 'Sursis avec mise à l\'épreuve (probation)', community: 'Travail d\'intérêt général',
    life: ['Walks in the courtyard and card games with the neighbours.', 'Overcrowded cells make tempers short.', 'Teachers come in twice a week.'],
  },
  jp: {
    criminalAge: 14, juvenileMax: 20,
    juvenileCourt: 'Family Court', adultCourt: 'District Court', police: 'police',
    juvenile: {
      light: F('jp_cls', 'Juvenile Classification Home (then probation)', 'juvenile', 2, 'Assessment and guidance before the Family Court decides.', std(['Counselling', 'School classes'])),
      heavy: F('jp_shonen', 'Juvenile Training School (Shōnen-in)', 'juvenile', 4, 'A disciplined, orderly school for young offenders with strict routines.', std(['School classes', 'Vocational workshops', 'Counselling', 'Sports'])),
    },
    adult: {
      low: F('jp_la', 'Prison (first-time offenders)', 'prison', 3, 'Quiet, regimented work in factory-like workshops.', std(['Prison industries', 'Vocational workshops', 'Counselling'])),
      mid: F('jp_prison', 'Prison', 'prison', 4, 'Strict silence, set postures and daily labour.', std(['Prison industries', 'Vocational workshops', 'Counselling'])),
      high: F('jp_lb', 'Long-term prison', 'prison', 5, 'For heavier sentences, with rigid routines and few visitors.', std(['Prison industries', 'Counselling'])),
    },
    drug: F('jp_rehab', 'Treatment programme', 'rehab', 2, 'Addiction treatment and supervised release.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.7, label: 'provisional release' },
    probation: 'Probation supervision', community: 'Guidance programme',
    life: ['Silence at meals and precise rules for everything.', 'The workshop runs like a small factory.', 'Letters and visits are carefully scheduled.'],
  },
  kr: {
    criminalAge: 14, juvenileMax: 19,
    juvenileCourt: 'Juvenile Division of the Family Court', adultCourt: 'District Court', police: 'police',
    juvenile: {
      light: F('kr_prot', 'Juvenile protection placement', 'juvenile', 2, 'A guided placement with counselling and school.', std(['Counselling', 'School classes'])),
      heavy: F('kr_reform', 'Juvenile Reformatory', 'juvenile', 4, 'A secure reformatory with schooling and skills training.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    },
    adult: {
      low: F('kr_open', 'Open correctional facility', 'prison', 3, 'A lower-security facility with work programmes.', std(['Vocational workshops', 'Prison industries'])),
      mid: F('kr_corr', 'Correctional institution', 'prison', 5, 'A disciplined institution with work and classes.', std(['Prison industries', 'Vocational workshops', 'Counselling'])),
      high: F('kr_max', 'Maximum-security correctional institution', 'prison', 7, 'Strict control and limited freedom.', std(['Counselling', 'Religious classes'])),
    },
    drug: F('kr_rehab', 'Treatment and custody programme', 'rehab', 2, 'Court-ordered treatment.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.7, label: 'parole' },
    probation: 'Probation order', community: 'Community service order',
    life: ['Roll call and work details start early.', 'Packed meals and a strict timetable.', 'Counsellors help prepare you for release.'],
  },
  in: {
    criminalAge: 7, juvenileMax: 18, youngAdultMax: 21,
    juvenileCourt: 'Juvenile Justice Board', adultCourt: 'Sessions Court', police: 'police',
    juvenile: {
      light: F('in_obs', 'Observation Home', 'juvenile', 3, 'Temporary housing for juveniles during inquiry, with schooling and counselling.', std(['School classes', 'Counselling', 'Vocational workshops'])),
      heavy: F('in_special', 'Special Home / Place of Safety', 'juvenile', 5, 'A longer-term home for juveniles found to have committed offences.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    },
    youngAdult: F('in_borstal', 'Borstal school', 'prison', 5, 'Reform-focused institution for young offenders.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    adult: {
      low: F('in_district', 'District jail', 'prison', 6, 'Overcrowded barracks and waiting for hearings.', std(['Religious classes', 'Vocational workshops'])),
      mid: F('in_central', 'Central jail', 'prison', 7, 'A large jail with workshops, a canteen and plenty of politics.', std(['Vocational workshops', 'Prison industries', 'School classes'])),
      high: F('in_high', 'High-security central jail', 'prison', 9, 'Heavily guarded wards, little freedom.', std(['Religious classes', 'Counselling'])),
    },
    drug: F('in_deaddict', 'De-addiction centre', 'rehab', 3, 'Residential treatment with counselling.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.75, label: 'remission and early release' },
    probation: 'Probation of Offenders order', community: 'Community service',
    life: ['Crowded barracks, with everyone finding a corner of their own.', 'Prison factories make furniture, bread and textiles.', 'Court dates come and go slowly.'],
  },
  br: {
    criminalAge: 12, juvenileMax: 18,
    juvenileCourt: 'Vara da Infância e Juventude (Childhood and Youth Court)', adultCourt: 'Tribunal de Justiça', police: 'polícia',
    juvenile: {
      light: F('br_semi', 'Semi-liberty socio-educational unit', 'juvenile', 3, 'Youth live in a unit but study and work outside.', std(['School classes', 'Vocational workshops', 'Counselling'])),
      heavy: F('br_casa', 'Fundação CASA (internment unit)', 'juvenile', 6, 'A secure socio-educational unit with schooling and workshops.', std(['School classes', 'Vocational workshops', 'Counselling', 'Sports'])),
    },
    adult: {
      low: F('br_semiopen', 'Semi-open penal colony', 'prison', 4, 'Work by day, return at night.', std(['Vocational workshops', 'Prison industries'])),
      mid: F('br_presidio', 'Presídio (closed regime)', 'prison', 8, 'Overcrowded cells and factions control the corridors.', std(['School classes', 'Religious classes'])),
      high: F('br_max', 'Maximum-security penitentiary', 'prison', 9, 'High security, isolation and lockdowns.', std(['Religious classes', 'Counselling'])),
    },
    drug: F('br_caps', 'Treatment centre (CAPS-AD)', 'rehab', 2, 'Addiction treatment through the public health network.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.6, label: 'progression of regime' },
    probation: 'Liberdade assistida (supervised liberty)', community: 'Prestação de serviços à comunidade',
    life: ['Visitor days are everything.', 'Every wing has its own unwritten rules.', 'The radio carries football and soap operas down the hall.'],
  },
  mx: {
    criminalAge: 12, juvenileMax: 18,
    juvenileCourt: 'Juzgado para Adolescentes', adultCourt: 'Juzgado Penal', police: 'policía',
    juvenile: {
      light: F('mx_tratamiento', 'Centro de tratamiento para adolescentes', 'juvenile', 3, 'A supervised treatment centre with schooling and workshops.', std(['School classes', 'Vocational workshops', 'Counselling'])),
      heavy: F('mx_internamiento', 'Centro de internamiento para adolescentes', 'juvenile', 5, 'A closed centre for serious offences.', std(['School classes', 'Vocational workshops', 'Counselling'])),
    },
    adult: {
      low: F('mx_cereso1', 'CERESO (state prison)', 'prison', 6, 'Crowded cells, family visits on weekends.', std(['Vocational workshops', 'School classes', 'Religious classes'])),
      mid: F('mx_cereso2', 'CERESO (large state prison)', 'prison', 7, 'Internal economy runs on favours and money.', std(['Vocational workshops', 'Religious classes'])),
      high: F('mx_cefereso', 'CEFERESO (federal maximum-security prison)', 'prison', 9, 'Isolation, cameras and tight control.', std(['Counselling', 'Religious classes'])),
    },
    drug: F('mx_cij', 'Residential addiction treatment', 'rehab', 3, 'Treatment under a court order.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.7, label: 'early release for good behaviour' },
    probation: 'Libertad condicionada', community: 'Trabajo en favor de la comunidad',
    life: ['Weekend visits fill the courtyard with food and family.', 'The workshop pays in small coins and cigarettes.', 'Everyone knows who runs the cellblock.'],
  },
  ng: {
    criminalAge: 7, juvenileMax: 18, youngAdultMax: 21,
    juvenileCourt: 'Juvenile / Family Court', adultCourt: 'Magistrate Court', police: 'police',
    juvenile: {
      light: F('ng_remand', 'Remand home', 'juvenile', 3, 'A holding home for young people while their case is heard.', std(['School classes', 'Counselling', 'Vocational workshops'])),
      heavy: F('ng_borstal', 'Borstal institution', 'juvenile', 5, 'A reformative institution for young offenders.', std(['School classes', 'Vocational workshops', 'Religious classes'])),
    },
    youngAdult: F('ng_borstal2', 'Borstal institution (older youths)', 'prison', 6, 'Reform and discipline for older youths.', std(['School classes', 'Vocational workshops', 'Religious classes'])),
    adult: {
      low: F('ng_med', 'Medium-security custodial centre', 'prison', 7, 'Crowded cells with limited resources.', std(['Vocational workshops', 'Religious classes'])),
      mid: F('ng_med2', 'Medium-security custodial centre (large)', 'prison', 8, 'Overcrowding and slow trials.', std(['Vocational workshops', 'Religious classes'])),
      high: F('ng_max', 'Maximum-security custodial centre', 'prison', 9, 'The hardest regime in the system.', std(['Religious classes', 'Counselling'])),
    },
    drug: F('ng_rehab', 'Rehabilitation centre', 'rehab', 3, 'Treatment programme for drug offences.', std(['Drug treatment', 'Counselling'])),
    release: { frac: 0.7, label: 'remission and pardon' },
    probation: 'Probation order', community: 'Community service',
    life: ['Waiting for your next court date is its own kind of sentence.', 'Families bring food on visiting days.', 'Church and mosque services draw the biggest crowds.'],
  },
};

export const justiceFor = (countryId: string): JusticeSystem => JUSTICE[countryId] ?? JUSTICE.us;
export const facilityById = (id: string): Facility | undefined => {
  for (const s of Object.values(JUSTICE)) {
    const all = [s.juvenile.light, s.juvenile.heavy, s.youngAdult, s.adult.low, s.adult.mid, s.adult.high, s.drug];
    const f = all.find((x) => x?.id === id);
    if (f) return f;
  }
  return undefined;
};
