export type DroneClassId = 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'legacy_under250' | 'legacy_over250';

export type EasaCategory = 'A1' | 'A2' | 'A3' | 'Specific' | 'Certified';

export interface CountryRule {
  code: string;
  nameCz: string;
  nameEn: string;
  flagEmoji: string;
  region: 'Central' | 'Western' | 'Southern' | 'Northern' | 'Eastern' | 'Non-EU Schengen';
  authorityName: string;
  authorityWebsite: string;
  officialMapApp: string;
  officialMapUrl: string;
  maxAltitude: string;
  operatorRegistrationRequired: boolean;
  operatorRegCost: string;
  operatorRegPortalUrl: string;
  mandatoryInsurance: boolean;
  insuranceNotes: string;
  pilotMinAge: number;
  nightFlightAllowed: boolean | 'conditional';
  nightFlightNotes: string;
  fpvFlightRules: string;
  privacyCameraRules: string;
  natureReserveRules: string;
  penaltiesInfo: string;
  uniqueNationalRules: string[];
  lastUpdated: string;
}

export interface DroneClassInfo {
  id: DroneClassId;
  label: string;
  weightLimit: string;
  maxWeightGrams: number;
  primaryCategory: EasaCategory;
  description: string;
  examRequired: string;
  remoteIdRequired: boolean;
  geoAwarenessRequired: boolean;
  flyingOverPeopleRule: string;
  speedLimit?: string;
}

export interface RuleRequirement {
  id: string;
  title: string;
  type: 'mandatory' | 'warning' | 'info';
  category: 'Registration' | 'Certificate' | 'Equipment' | 'Distance' | 'Insurance' | 'LocalApp';
  content: string;
  iconName?: string;
}

export interface DocRuleItem {
  id: string;
  title: string;
  description: string;
  ruleType: 'mandatory' | 'warning' | 'info';
  applyTo: string;
  countryCode?: string;
}

export interface DocAnalysisResult {
  title: string;
  summary: string;
  categories: string[];
  keyRules: DocRuleItem[];
  countryNotes?: Record<string, string>;
  warnings?: string[];
  importedAt?: string;
}

export interface WizardAnswers {
  countryCode: string;
  droneWeight: 'under250g' | '250g_to_900g' | '900g_to_4kg' | 'over4kg';
  hasClassMarking: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'none';
  hasCamera: boolean;
  flyLocation: 'open_field' | 'suburbs_park' | 'city_crowd' | 'nature_protected' | 'airport_zone';
  purpose: 'recreational' | 'commercial';
}

export interface WizardDiagnostic {
  category: EasaCategory;
  canFly: 'yes' | 'conditional' | 'prohibited';
  title: string;
  mainRecommendation: string;
  checklist: Array<{
    text: string;
    status: 'pass' | 'warn' | 'fail';
    actionNeeded?: string;
  }>;
  requiredLicense: string;
  operatorRegistrationNeeded: boolean;
  insuranceNeeded: boolean;
  localMapToUse: {
    name: string;
    url: string;
  };
}
