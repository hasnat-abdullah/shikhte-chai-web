// Taxonomy and field definitions for the professionals directory.
// Keep in sync with supabase/migrations (the database enforces the same lists).
import type { Lang } from './categories';

type L = { bn: string; en: string };
export interface Option { value: string; bn: string; en: string; hint?: L }

// Types follow how the professions are organised in Bangladesh (Mental Health Act 2018, University of Dhaka programmes,
// BM&DC registration for doctors). Only psychiatrists have a statutory register; the other titles are not legally protected.
export const TYPES: Option[] = [
  { value: 'psychiatrist', bn: 'মনোরোগ বিশেষজ্ঞ', en: 'Psychiatrist', hint: { bn: 'চিকিৎসক (MBBS ও মনোরোগে স্নাতকোত্তর: MD, FCPS বা MCPS), BM&DC নিবন্ধিত। রোগ নির্ণয় ও ওষুধ দিতে পারেন', en: 'Medical doctor (MBBS plus postgraduate psychiatry: MD, FCPS or MCPS), BM&DC registered. Can diagnose and prescribe' } },
  { value: 'clinical_psychologist', bn: 'ক্লিনিক্যাল সাইকোলজিস্ট', en: 'Clinical psychologist', hint: { bn: 'সাধারণত MS/MPhil (ক্লিনিক্যাল সাইকোলজি)। মূল্যায়ন ও থেরাপি করেন, ওষুধ দেন না। সরকারি নিবন্ধন নেই', en: 'Usually MS/MPhil in clinical psychology. Assessment and therapy, does not prescribe. No statutory register' } },
  { value: 'counselling_psychologist', bn: 'কাউন্সেলিং সাইকোলজিস্ট', en: 'Counselling psychologist', hint: { bn: 'সাধারণত MS (কাউন্সেলিং সাইকোলজি)। কথোপকথনভিত্তিক সহায়তা। সরকারি নিবন্ধন নেই', en: 'Usually MS in counselling psychology. Talk-based support. No statutory register' } },
  { value: 'educational_psychologist', bn: 'এডুকেশনাল সাইকোলজিস্ট', en: 'Educational psychologist', hint: { bn: 'শেখা, আচরণ ও বিদ্যালয়-সংক্রান্ত বিষয়ে সহায়তা। সরকারি নিবন্ধন নেই', en: 'Support with learning, behaviour and school matters. No statutory register' } },
  { value: 'psychotherapist', bn: 'সাইকোথেরাপিস্ট', en: 'Psychotherapist', hint: { bn: 'নির্দিষ্ট থেরাপি পদ্ধতিতে প্রশিক্ষিত। পদবির জন্য নিবন্ধন বা নির্দিষ্ট প্রশিক্ষণ বাধ্যতামূলক নয়', en: 'Trained in specific therapy methods. No registration or set training is required for the title' } },
  { value: 'counsellor', bn: 'কাউন্সেলর', en: 'Counsellor', hint: { bn: 'পদবি আইনে সুরক্ষিত নয়, ন্যূনতম প্রশিক্ষণের আইনি মান নেই। প্রশিক্ষণ ও অভিজ্ঞতা জিজ্ঞেস করুন', en: 'Title is not legally protected and there is no legal minimum training. Ask about training and experience' } },
  { value: 'allied', bn: 'সহায়ক মানসিক স্বাস্থ্য পেশাজীবী', en: 'Allied mental health professional', hint: { bn: 'যেমন সাইকিয়াট্রিক সোশ্যাল ওয়ার্কার, অকুপেশনাল থেরাপিস্ট, সাইকিয়াট্রিক নার্স', en: 'For example psychiatric social worker, occupational therapist, psychiatric nurse' } },
];

// Ordered by public-health priority (WHO mhGAP conditions and the NIMH's clinics first), then common counselling areas.
export const SPECIALIZATIONS: Option[] = [
  { value: 'depression', bn: 'বিষণ্ণতা', en: 'Depression' },
  { value: 'anxiety', bn: 'দুশ্চিন্তা ও প্যানিক', en: 'Anxiety & panic' },
  { value: 'suicide_selfharm', bn: 'আত্মহত্যার চিন্তা ও নিজেকে আঘাত', en: 'Suicidal thoughts & self-harm' },
  { value: 'bipolar', bn: 'বাইপোলার', en: 'Bipolar disorder' },
  { value: 'psychosis', bn: 'সাইকোসিস ও স্কিজোফ্রেনিয়া', en: 'Psychosis & schizophrenia' },
  { value: 'addiction', bn: 'আসক্তি (মাদক, মদ ও অন্যান্য)', en: 'Addiction (drugs, alcohol, other)' },
  { value: 'ocd', bn: 'ওসিডি (OCD)', en: 'OCD' },
  { value: 'trauma', bn: 'ট্রমা ও PTSD', en: 'Trauma & PTSD' },
  { value: 'autism_dev', bn: 'অটিজম ও বিকাশজনিত সমস্যা', en: 'Autism & developmental disorders' },
  { value: 'adhd', bn: 'ADHD ও শিশুর আচরণগত সমস্যা', en: 'ADHD & child behaviour' },
  { value: 'dementia_older', bn: 'বয়স্কদের সমস্যা ও ডিমেনশিয়া', en: 'Older adults & dementia' },
  { value: 'sexual_health', bn: 'যৌন স্বাস্থ্য', en: 'Sexual health' },
  { value: 'relationships', bn: 'সম্পর্ক ও দাম্পত্য', en: 'Relationships & couples' },
  { value: 'family', bn: 'পারিবারিক সমস্যা', en: 'Family issues' },
  { value: 'parenting', bn: 'সন্তান লালনপালনে পরামর্শ', en: 'Parenting guidance' },
  { value: 'stress', bn: 'স্ট্রেস ও কর্মজীবন', en: 'Stress & work' },
  { value: 'anger', bn: 'রাগ নিয়ন্ত্রণ', en: 'Anger' },
  { value: 'grief', bn: 'শোক ও ক্ষতি', en: 'Grief & loss' },
  { value: 'self_esteem', bn: 'আত্মবিশ্বাস ও আত্মমর্যাদা', en: 'Self-esteem' },
  { value: 'sleep', bn: 'ঘুমের সমস্যা', en: 'Sleep problems' },
  { value: 'eating', bn: 'খাওয়ার সমস্যা', en: 'Eating problems' },
  { value: 'study_learning', bn: 'পড়াশোনা ও শেখার সমস্যা', en: 'Study & learning' },
  { value: 'assessment', bn: 'মনস্তাত্ত্বিক পরীক্ষা ও মূল্যায়ন', en: 'Psychological testing & assessment' },
];

export const MODES: Option[] = [
  { value: 'offline', bn: 'সরাসরি (চেম্বার/ক্লিনিক)', en: 'In person' },
  { value: 'online', bn: 'অনলাইন', en: 'Online' },
];

export const LANGUAGES: Option[] = [
  { value: 'bn', bn: 'বাংলা', en: 'Bangla' },
  { value: 'en', bn: 'ইংরেজি', en: 'English' },
  { value: 'other', bn: 'অন্য ভাষা', en: 'Other' },
];

// 18 is the legal line between child and adult in Bangladesh (Children Act 2013); the NIMH runs a combined child and adolescent clinic.
export const AGES: Option[] = [
  { value: 'child', bn: 'শিশু (প্রায় ১২ বছর পর্যন্ত)', en: 'Children (up to about 12)' },
  { value: 'adolescent', bn: 'কিশোর-কিশোরী (১৩–১৭)', en: 'Adolescents (13–17)' },
  { value: 'adult', bn: 'প্রাপ্তবয়স্ক (১৮+)', en: 'Adults (18+)' },
  { value: 'older', bn: 'বয়স্ক (৬০+)', en: 'Older adults (60+)' },
];

export const VERIFIED = ['none', 'registration', 'credentials'] as const;
export type Verified = (typeof VERIFIED)[number];

export const STATUSES = ['pending', 'approved', 'rejected'] as const;
export type Status = (typeof STATUSES)[number];

// 64 districts: [value, Bangla, English, division]
const D = (rows: string[][], division: string) => rows.map(([v, bn, en]) => ({ value: v, bn, en, division }));
export const DISTRICTS = [
  ...D([['dhaka', 'ঢাকা', 'Dhaka'], ['gazipur', 'গাজীপুর', 'Gazipur'], ['narayanganj', 'নারায়ণগঞ্জ', 'Narayanganj'], ['narsingdi', 'নরসিংদী', 'Narsingdi'], ['manikganj', 'মানিকগঞ্জ', 'Manikganj'], ['munshiganj', 'মুন্সিগঞ্জ', 'Munshiganj'], ['tangail', 'টাঙ্গাইল', 'Tangail'], ['kishoreganj', 'কিশোরগঞ্জ', 'Kishoreganj'], ['faridpur', 'ফরিদপুর', 'Faridpur'], ['gopalganj', 'গোপালগঞ্জ', 'Gopalganj'], ['madaripur', 'মাদারীপুর', 'Madaripur'], ['rajbari', 'রাজবাড়ী', 'Rajbari'], ['shariatpur', 'শরীয়তপুর', 'Shariatpur']], 'dhaka'),
  ...D([['chattogram', 'চট্টগ্রাম', 'Chattogram'], ['coxs-bazar', 'কক্সবাজার', "Cox's Bazar"], ['cumilla', 'কুমিল্লা', 'Cumilla'], ['brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'Brahmanbaria'], ['chandpur', 'চাঁদপুর', 'Chandpur'], ['lakshmipur', 'লক্ষ্মীপুর', 'Lakshmipur'], ['noakhali', 'নোয়াখালী', 'Noakhali'], ['feni', 'ফেনী', 'Feni'], ['khagrachhari', 'খাগড়াছড়ি', 'Khagrachhari'], ['rangamati', 'রাঙ্গামাটি', 'Rangamati'], ['bandarban', 'বান্দরবান', 'Bandarban']], 'chattogram'),
  ...D([['rajshahi', 'রাজশাহী', 'Rajshahi'], ['bogura', 'বগুড়া', 'Bogura'], ['pabna', 'পাবনা', 'Pabna'], ['sirajganj', 'সিরাজগঞ্জ', 'Sirajganj'], ['natore', 'নাটোর', 'Natore'], ['naogaon', 'নওগাঁ', 'Naogaon'], ['joypurhat', 'জয়পুরহাট', 'Joypurhat'], ['chapai-nawabganj', 'চাঁপাইনবাবগঞ্জ', 'Chapai Nawabganj']], 'rajshahi'),
  ...D([['khulna', 'খুলনা', 'Khulna'], ['jashore', 'যশোর', 'Jashore'], ['satkhira', 'সাতক্ষীরা', 'Satkhira'], ['bagerhat', 'বাগেরহাট', 'Bagerhat'], ['kushtia', 'কুষ্টিয়া', 'Kushtia'], ['chuadanga', 'চুয়াডাঙ্গা', 'Chuadanga'], ['meherpur', 'মেহেরপুর', 'Meherpur'], ['jhenaidah', 'ঝিনাইদহ', 'Jhenaidah'], ['magura', 'মাগুরা', 'Magura'], ['narail', 'নড়াইল', 'Narail']], 'khulna'),
  ...D([['barishal', 'বরিশাল', 'Barishal'], ['bhola', 'ভোলা', 'Bhola'], ['patuakhali', 'পটুয়াখালী', 'Patuakhali'], ['pirojpur', 'পিরোজপুর', 'Pirojpur'], ['jhalokati', 'ঝালকাঠি', 'Jhalokati'], ['barguna', 'বরগুনা', 'Barguna']], 'barishal'),
  ...D([['sylhet', 'সিলেট', 'Sylhet'], ['moulvibazar', 'মৌলভীবাজার', 'Moulvibazar'], ['habiganj', 'হবিগঞ্জ', 'Habiganj'], ['sunamganj', 'সুনামগঞ্জ', 'Sunamganj']], 'sylhet'),
  ...D([['rangpur', 'রংপুর', 'Rangpur'], ['dinajpur', 'দিনাজপুর', 'Dinajpur'], ['gaibandha', 'গাইবান্ধা', 'Gaibandha'], ['kurigram', 'কুড়িগ্রাম', 'Kurigram'], ['lalmonirhat', 'লালমনিরহাট', 'Lalmonirhat'], ['nilphamari', 'নীলফামারী', 'Nilphamari'], ['panchagarh', 'পঞ্চগড়', 'Panchagarh'], ['thakurgaon', 'ঠাকুরগাঁও', 'Thakurgaon']], 'rangpur'),
  ...D([['mymensingh', 'ময়মনসিংহ', 'Mymensingh'], ['jamalpur', 'জামালপুর', 'Jamalpur'], ['netrokona', 'নেত্রকোণা', 'Netrokona'], ['sherpur', 'শেরপুর', 'Sherpur']], 'mymensingh'),
];

/** The professional's record as the public sees it (private columns are never sent to visitors). */
export interface Professional {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  name_en: string | null;
  type: string;
  designation: string | null;
  qualifications: string;
  specializations: string[];
  modes: string[];
  languages: string[];
  ages: string[];
  district: string;
  verified: Verified;
  area: string | null;
  clinic_name: string | null;
  address: string | null;
  fee_note: string | null;
  availability: string | null;
  bio: string;
  phone: string;
  email_public: string | null;
  website: string | null;
}

/** Columns visitors may read. Must match the column grants in supabase/migrations. */
export const PUBLIC_COLUMNS = [
  'id', 'created_at', 'updated_at', 'name', 'name_en', 'type', 'designation', 'qualifications', 'specializations', 'modes', 'languages', 'ages',
  'district', 'verified', 'area', 'clinic_name', 'address', 'fee_note', 'availability', 'bio', 'phone', 'email_public', 'website',
] as const;

/** Columns a submission may set. Status and the admin notes are not writable by visitors. */
export const SUBMIT_COLUMNS = [
  'name', 'name_en', 'type', 'designation', 'qualifications', 'specializations', 'modes', 'languages', 'ages', 'district', 'area', 'clinic_name',
  'address', 'fee_note', 'availability', 'bio', 'phone', 'email_public', 'website', 'registration_no', 'credentials_note', 'submitter_email', 'consent',
] as const;

export const BIO_MAX = 450;
export const BIO_MIN = 20;

const find = (list: Option[], v: string) => list.find((o) => o.value === v);
export const label = (list: Option[], v: string, lang: Lang) => find(list, v)?.[lang] ?? v;
export const districtName = (v: string, lang: Lang) => DISTRICTS.find((d) => d.value === v)?.[lang] ?? v;
export const DIVISIONS = ['dhaka', 'chattogram', 'rajshahi', 'khulna', 'barishal', 'sylhet', 'rangpur', 'mymensingh'];
export const DIVISION_NAMES: Record<string, L> = {
  dhaka: { bn: 'ঢাকা বিভাগ', en: 'Dhaka Division' }, chattogram: { bn: 'চট্টগ্রাম বিভাগ', en: 'Chattogram Division' }, rajshahi: { bn: 'রাজশাহী বিভাগ', en: 'Rajshahi Division' },
  khulna: { bn: 'খুলনা বিভাগ', en: 'Khulna Division' }, barishal: { bn: 'বরিশাল বিভাগ', en: 'Barishal Division' }, sylhet: { bn: 'সিলেট বিভাগ', en: 'Sylhet Division' },
  rangpur: { bn: 'রংপুর বিভাগ', en: 'Rangpur Division' }, mymensingh: { bn: 'ময়মনসিংহ বিভাগ', en: 'Mymensingh Division' },
};

/** Validation shared by the public form and the admin editor. Returns an error key per invalid field. */
export function validate(v: Record<string, any>): Record<string, string> {
  const e: Record<string, string> = {};
  const txt = (k: string) => String(v[k] ?? '').trim();
  const arr = (k: string) => (Array.isArray(v[k]) ? v[k] : []);
  if (txt('name').length < 2) e.name = 'required';
  if (!find(TYPES, txt('type'))) e.type = 'required';
  if (txt('qualifications').length < 2) e.qualifications = 'required';
  if (arr('specializations').length < 1) e.specializations = 'required';
  else if (arr('specializations').length > 6) e.specializations = 'max6';
  if (arr('modes').length < 1) e.modes = 'required';
  if (arr('languages').length < 1) e.languages = 'required';
  if (!DISTRICTS.some((d) => d.value === txt('district'))) e.district = 'required';
  if (arr('modes').includes('offline') && !txt('address') && !txt('clinic_name')) e.address = 'offline';
  const bio = txt('bio');
  if (bio.length < BIO_MIN) e.bio = 'short'; else if (bio.length > BIO_MAX) e.bio = 'long';
  if (!/^[0-9+() -]{6,30}$/.test(txt('phone'))) e.phone = 'phone';
  if (txt('email_public') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(txt('email_public'))) e.email_public = 'email';
  if (txt('website') && !/^https?:\/\/\S+$/i.test(txt('website'))) e.website = 'url';
  // Psychiatrists must give their BM&DC registration number (the only statutory register). Everyone else describes their training.
  if (txt('type') === 'psychiatrist') { if (txt('registration_no').length < 3) e.registration_no = 'regno'; }
  else if (txt('type') && txt('credentials_note').length < 10) e.credentials_note = 'cred';
  if (v.submitter_email !== undefined && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(txt('submitter_email'))) e.submitter_email = 'email';
  return e;
}
