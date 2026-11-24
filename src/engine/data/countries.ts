import type { Country } from '../types';

// tax.rates apply to income bands of [0-0.5, 0.5-1.5, 1.5-4, 4+] × the country's median income.
export const COUNTRIES: Country[] = [
  { id: 'us', name: 'United States', flag: '🇺🇸', currency: 'USD', fx: 1, locale: 'en-US', wageIndex: 1, costIndex: 1, housingIndex: 1, tax: { rates: [0.04, 0.17, 0.27, 0.37], payroll: 0.0765 }, healthcare: 'private', tuitionIndex: 1.1, lifeExpectancy: 79, welfare: 0.35, inflationBias: 0, retirementAge: 67, pensionRate: 0.38, unemploymentBias: 0, inheritanceTax: 0.1, cities: ['New York', 'Austin', 'Chicago', 'Seattle', 'Atlanta', 'Denver', 'Los Angeles', 'Boston'], names: 'en' },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', fx: 0.79, locale: 'en-GB', wageIndex: 0.82, costIndex: 0.92, housingIndex: 0.9, tax: { rates: [0.03, 0.2, 0.35, 0.45], payroll: 0.08 }, healthcare: 'public', tuitionIndex: 0.7, lifeExpectancy: 81, welfare: 0.6, inflationBias: 0.003, retirementAge: 67, pensionRate: 0.3, unemploymentBias: -0.003, inheritanceTax: 0.25, cities: ['London', 'Manchester', 'Bristol', 'Edinburgh', 'Leeds', 'Cardiff', 'Birmingham'], names: 'en' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', currency: 'CAD', fx: 1.36, locale: 'en-CA', wageIndex: 0.88, costIndex: 0.95, housingIndex: 1.0, tax: { rates: [0.05, 0.2, 0.31, 0.44], payroll: 0.065 }, healthcare: 'public', tuitionIndex: 0.55, lifeExpectancy: 82, welfare: 0.55, inflationBias: 0, retirementAge: 65, pensionRate: 0.4, unemploymentBias: 0.004, inheritanceTax: 0.0, cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Halifax'], names: 'en' },
  { id: 'au', name: 'Australia', flag: '🇦🇺', currency: 'AUD', fx: 1.52, locale: 'en-AU', wageIndex: 0.95, costIndex: 1.0, housingIndex: 1.05, tax: { rates: [0.03, 0.19, 0.32, 0.45], payroll: 0.02 }, healthcare: 'mixed', tuitionIndex: 0.6, lifeExpectancy: 83, welfare: 0.55, inflationBias: 0.002, retirementAge: 67, pensionRate: 0.35, unemploymentBias: -0.002, inheritanceTax: 0.0, cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'], names: 'en' },
  { id: 'de', name: 'Germany', flag: '🇩🇪', currency: 'EUR', fx: 0.92, locale: 'de-DE', wageIndex: 0.84, costIndex: 0.9, housingIndex: 0.85, tax: { rates: [0.06, 0.24, 0.38, 0.45], payroll: 0.2 }, healthcare: 'public', tuitionIndex: 0.08, lifeExpectancy: 81, welfare: 0.75, inflationBias: 0, retirementAge: 66, pensionRate: 0.48, unemploymentBias: -0.006, inheritanceTax: 0.15, cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Leipzig'], names: 'de' },
  { id: 'fr', name: 'France', flag: '🇫🇷', currency: 'EUR', fx: 0.92, locale: 'fr-FR', wageIndex: 0.78, costIndex: 0.92, housingIndex: 0.85, tax: { rates: [0.05, 0.22, 0.38, 0.45], payroll: 0.22 }, healthcare: 'public', tuitionIndex: 0.1, lifeExpectancy: 83, welfare: 0.8, inflationBias: 0, retirementAge: 64, pensionRate: 0.55, unemploymentBias: 0.012, inheritanceTax: 0.2, cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nantes'], names: 'fr' },
  { id: 'jp', name: 'Japan', flag: '🇯🇵', currency: 'JPY', fx: 150, locale: 'ja-JP', wageIndex: 0.72, costIndex: 0.85, housingIndex: 0.75, tax: { rates: [0.04, 0.18, 0.28, 0.45], payroll: 0.15 }, healthcare: 'mixed', tuitionIndex: 0.45, lifeExpectancy: 85, welfare: 0.5, inflationBias: -0.012, retirementAge: 65, pensionRate: 0.4, unemploymentBias: -0.025, inheritanceTax: 0.3, cities: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Fukuoka', 'Sapporo'], names: 'ja' },
  { id: 'kr', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', fx: 1350, locale: 'ko-KR', wageIndex: 0.68, costIndex: 0.8, housingIndex: 0.85, tax: { rates: [0.05, 0.18, 0.3, 0.42], payroll: 0.09 }, healthcare: 'mixed', tuitionIndex: 0.4, lifeExpectancy: 83, welfare: 0.4, inflationBias: 0, retirementAge: 63, pensionRate: 0.35, unemploymentBias: -0.015, inheritanceTax: 0.3, cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'], names: 'ko' },
  { id: 'in', name: 'India', flag: '🇮🇳', currency: 'INR', fx: 83, locale: 'en-IN', wageIndex: 0.16, costIndex: 0.3, housingIndex: 0.3, tax: { rates: [0.0, 0.1, 0.2, 0.3], payroll: 0.05 }, healthcare: 'mixed', tuitionIndex: 0.12, lifeExpectancy: 71, welfare: 0.15, inflationBias: 0.03, retirementAge: 60, pensionRate: 0.2, unemploymentBias: 0.015, inheritanceTax: 0, cities: ['Mumbai', 'Bengaluru', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'], names: 'in' },
  { id: 'br', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', fx: 5, locale: 'pt-BR', wageIndex: 0.24, costIndex: 0.42, housingIndex: 0.4, tax: { rates: [0.0, 0.12, 0.25, 0.3], payroll: 0.11 }, healthcare: 'mixed', tuitionIndex: 0.15, lifeExpectancy: 76, welfare: 0.3, inflationBias: 0.025, retirementAge: 62, pensionRate: 0.5, unemploymentBias: 0.025, inheritanceTax: 0.04, cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Curitiba', 'Recife'], names: 'pt' },
  { id: 'mx', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', fx: 17.2, locale: 'es-MX', wageIndex: 0.22, costIndex: 0.45, housingIndex: 0.4, tax: { rates: [0.02, 0.14, 0.26, 0.32], payroll: 0.06 }, healthcare: 'mixed', tuitionIndex: 0.15, lifeExpectancy: 75, welfare: 0.25, inflationBias: 0.015, retirementAge: 65, pensionRate: 0.3, unemploymentBias: -0.005, inheritanceTax: 0, cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún', 'Mérida'], names: 'es' },
  { id: 'ng', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', fx: 1500, locale: 'en-NG', wageIndex: 0.09, costIndex: 0.28, housingIndex: 0.25, tax: { rates: [0.0, 0.1, 0.2, 0.25], payroll: 0.04 }, healthcare: 'private', tuitionIndex: 0.1, lifeExpectancy: 55, welfare: 0.05, inflationBias: 0.1, retirementAge: 60, pensionRate: 0.15, unemploymentBias: 0.04, inheritanceTax: 0, cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'], names: 'ng' },
  { id: 'my', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', fx: 4.5, locale: 'ms-MY', wageIndex: 0.28, costIndex: 0.46, housingIndex: 0.45, tax: { rates: [0.0, 0.08, 0.2, 0.3], payroll: 0.11 }, healthcare: 'mixed', tuitionIndex: 0.2, lifeExpectancy: 76, welfare: 0.2, inflationBias: 0.005, retirementAge: 60, pensionRate: 0.3, unemploymentBias: -0.012, inheritanceTax: 0, cities: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Shah Alam', 'Kota Kinabalu', 'Kuching', 'Ipoh'], names: 'ms' },
  { id: 'sg', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', fx: 1.34, locale: 'en-SG', wageIndex: 0.95, costIndex: 1.05, housingIndex: 1.3, tax: { rates: [0.0, 0.07, 0.15, 0.24], payroll: 0.2 }, healthcare: 'mixed', tuitionIndex: 0.35, lifeExpectancy: 84, welfare: 0.3, inflationBias: -0.002, retirementAge: 63, pensionRate: 0.35, unemploymentBias: -0.025, inheritanceTax: 0, cities: ['Singapore'], names: 'zh' },
];

export const DESTINATIONS: { id: string; name: string; flag: string; tier: 1 | 2 | 3; region: string }[] = [
  ...COUNTRIES.map((c) => ({ id: c.id, name: c.name, flag: c.flag, tier: (c.wageIndex > 0.7 ? 3 : c.wageIndex > 0.25 ? 2 : 1) as 1 | 2 | 3, region: '' })),
  { id: 'th', name: 'Thailand', flag: '🇹🇭', tier: 1, region: 'Asia' },
  { id: 'vn', name: 'Vietnam', flag: '🇻🇳', tier: 1, region: 'Asia' },
  { id: 'id', name: 'Indonesia', flag: '🇮🇩', tier: 1, region: 'Asia' },
  { id: 'it', name: 'Italy', flag: '🇮🇹', tier: 2, region: 'Europe' },
  { id: 'es', name: 'Spain', flag: '🇪🇸', tier: 2, region: 'Europe' },
  { id: 'gr', name: 'Greece', flag: '🇬🇷', tier: 2, region: 'Europe' },
  { id: 'is', name: 'Iceland', flag: '🇮🇸', tier: 3, region: 'Europe' },
  { id: 'ch', name: 'Switzerland', flag: '🇨🇭', tier: 3, region: 'Europe' },
  { id: 'tr', name: 'Türkiye', flag: '🇹🇷', tier: 1, region: 'Asia' },
  { id: 'eg', name: 'Egypt', flag: '🇪🇬', tier: 1, region: 'Africa' },
  { id: 'ma', name: 'Morocco', flag: '🇲🇦', tier: 1, region: 'Africa' },
  { id: 'ke', name: 'Kenya', flag: '🇰🇪', tier: 2, region: 'Africa' },
  { id: 'za', name: 'South Africa', flag: '🇿🇦', tier: 2, region: 'Africa' },
  { id: 'ae', name: 'United Arab Emirates', flag: '🇦🇪', tier: 3, region: 'Middle East' },
  { id: 'pe', name: 'Peru', flag: '🇵🇪', tier: 1, region: 'Americas' },
  { id: 'ar', name: 'Argentina', flag: '🇦🇷', tier: 2, region: 'Americas' },
  { id: 'nz', name: 'New Zealand', flag: '🇳🇿', tier: 3, region: 'Oceania' },
  { id: 'cn', name: 'China', flag: '🇨🇳', tier: 2, region: 'Asia' },
  { id: 'ph', name: 'Philippines', flag: '🇵🇭', tier: 1, region: 'Asia' },
];

export const getCountry = (id: string): Country => COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];
