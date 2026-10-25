// Places we can point people to. Shikhte Chai does not run, book or endorse these services.
// Every entry was checked against the organisation's own page or a published helpline directory on the date
// in each entry's `checked` field. Phone numbers and prices change: re-check them before editing this file, and only list
// services you are comfortable referring people to. Leave a field out rather than guess it.

export type Need = 'talk' | 'counselling' | 'psychiatry' | 'child' | 'addiction';
type L = { bn: string; en: string };

export interface Referral {
  id: string;
  kind: 'helpline' | 'government' | 'university' | 'private';
  needs: Need[];
  name: L;
  about: L;
  phones?: { number: string; label?: L }[];
  hours?: L;
  cost?: L;
  address?: L;
  web?: { url: string; label: string };
  how?: L;
  source: string;
  /** Date the details were checked against the source (YYYY-MM-DD). */
  checked: string;
}

export const REFERRALS: Referral[] = [
  {
    id: 'kaan-pete-roi',
    kind: 'helpline',
    needs: ['talk'],
    name: { bn: 'কান পেতে রই', en: 'Kaan Pete Roi' },
    about: { bn: 'আবেগীয় সহায়তা ও আত্মহত্যা প্রতিরোধ হেল্পলাইন। কথা বলার জন্য ফোন করুন।', en: 'Emotional support and suicide prevention helpline. Call to talk.' },
    phones: [{ number: '09612119911' }],
    hours: { bn: 'প্রতিদিন, বিকেল ৩টা থেকে রাত ৩টা', en: 'Every day, 3 pm to 3 am' },
    cost: { bn: 'বিনামূল্যে', en: 'Free' },
    web: { url: 'https://www.facebook.com/kaan.pete.roi/', label: 'Facebook' },
    source: 'kaanpeteroi.org, Lifeline International, The Daily Star',
    checked: '2026-10-24',
  },
  {
    id: 'child-helpline',
    kind: 'helpline',
    needs: ['child', 'talk'],
    name: { bn: 'শিশু হেল্পলাইন ১০৯৮', en: 'Child Helpline 1098' },
    about: { bn: 'শিশু ও কিশোরদের সহায়তার জাতীয় হেল্পলাইন।', en: 'National helpline for children and young people.' },
    phones: [{ number: '1098' }],
    hours: { bn: 'প্রতিদিন ২৪ ঘণ্টা', en: '24 hours, every day' },
    cost: { bn: 'বিনামূল্যে ও গোপনীয়', en: 'Free and confidential' },
    source: 'Find A Helpline',
    checked: '2026-10-24',
  },
  {
    id: 'nimh',
    kind: 'government',
    needs: ['psychiatry', 'counselling', 'child', 'addiction'],
    name: { bn: 'জাতীয় মানসিক স্বাস্থ্য ইনস্টিটিউট (NIMH)', en: 'National Institute of Mental Health (NIMH)' },
    about: {
      bn: 'সরকারি মানসিক স্বাস্থ্য হাসপাতাল। বহির্বিভাগ, ভর্তি রোগীর সেবা, মনোবিদদের কাউন্সেলিং ও সাইকোথেরাপি, এবং শিশু-কিশোর, বয়স্ক, বিষণ্ণতা, ওসিডি ও মাদকাসক্তির বিশেষ ক্লিনিক আছে।',
      en: 'Government mental health hospital. Outpatient and inpatient care, counselling and psychotherapy by psychologists, and special clinics for children and adolescents, older people, depression, OCD and drug addiction.',
    },
    phones: [{ number: '01340337733' }, { number: '02223374409' }],
    address: { bn: 'শেরেবাংলা নগর, ঢাকা', en: 'Sher-e-Bangla Nagar, Dhaka' },
    cost: { bn: 'সরকারি হাসপাতালের সেবা বিনামূল্যে বা খুব কম খরচে হয় (বাংলাদেশ অ্যাসোসিয়েশন অব সাইকিয়াট্রিস্টস অনুযায়ী)।', en: 'Government hospital care is free or very low cost (per the Bangladesh Association of Psychiatrists).' },
    how: { bn: 'বহির্বিভাগের সময় ও টিকিটের নিয়ম ওয়েবসাইটে নেই, ফোন করে জেনে নিন।', en: 'Outpatient hours and the ticket process are not listed online, so call to ask.' },
    web: { url: 'https://nimh.gov.bd', label: 'nimh.gov.bd' },
    source: 'nimh.gov.bd, bapbd.org',
    checked: '2026-10-24',
  },
  {
    id: 'bsmmu',
    kind: 'government',
    needs: ['psychiatry'],
    name: { bn: 'বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয় (BSMMU), মনোরোগ বিভাগ', en: 'BSMMU, Department of Psychiatry' },
    about: { bn: 'মনোরোগ বিশেষজ্ঞ দেখানোর সরকারি বিকল্প।', en: 'A government option for seeing a psychiatrist.' },
    address: { bn: 'শাহবাগ, ঢাকা', en: 'Shahbag, Dhaka' },
    how: { bn: 'আমরা এর ফোন নম্বর যাচাই করিনি। হাসপাতালে সরাসরি খোঁজ নিন।', en: 'We have not verified a phone number. Enquire at the hospital directly.' },
    source: 'bapbd.org',
    checked: '2026-10-24',
  },
  {
    id: 'govt-hospitals',
    kind: 'government',
    needs: ['psychiatry'],
    name: { bn: 'ঢাকার বাইরে: সরকারি হাসপাতাল', en: 'Outside Dhaka: government hospitals' },
    about: {
      bn: 'সব সরকারি মেডিকেল কলেজ হাসপাতালে মনোরোগ বিভাগ আছে। জেলা ও সদর হাসপাতালে পরামর্শক মনোরোগ বিশেষজ্ঞ থাকেন, আর উপজেলা স্বাস্থ্য কমপ্লেক্সে মানসিক স্বাস্থ্যে প্রশিক্ষিত চিকিৎসক আছেন (প্রধানের সঙ্গে যোগাযোগ করুন)।',
      en: 'Every government medical college hospital has a psychiatry department. District and Sadar hospitals have consultant psychiatrists, and Upazila Health Complexes have doctors trained in mental health (contact the head of the complex).',
    },
    cost: { bn: 'সরকারি হাসপাতালের সেবা বিনামূল্যে বা খুব কম খরচে।', en: 'Government hospital care is free or very low cost.' },
    web: { url: 'https://bapbd.org/treatment.php', label: 'bapbd.org' },
    source: 'bapbd.org',
    checked: '2026-10-24',
  },
  {
    id: 'npu',
    kind: 'university',
    needs: ['counselling', 'child'],
    name: { bn: 'নাসিরুল্লাহ সাইকোথেরাপি ইউনিট (NPU)', en: 'Nasirullah Psychotherapy Unit (NPU)' },
    about: {
      bn: 'ঢাকা বিশ্ববিদ্যালয়ের ক্লিনিক্যাল সাইকোলজি বিভাগের অধীনে সাইকোথেরাপি সেবা। ব্যক্তি, দম্পতি, পরিবার এবং শিশু-কিশোরদের থেরাপি, মনস্তাত্ত্বিক পরীক্ষা ও মূল্যায়ন, এবং সামাজিক ও জীবনদক্ষতা প্রশিক্ষণ দেয়।',
      en: 'Psychotherapy service run under the Department of Clinical Psychology, University of Dhaka. Offers individual, couple, family and child and adolescent therapy, psychological testing and assessment, and social and life skills training.',
    },
    phones: [{ number: '01755654835', label: { bn: 'ফোন ও হোয়াটসঅ্যাপ', en: 'Phone and WhatsApp' } }, { number: '01727906007' }],
    address: { bn: 'আর্টস ভবনের ৩য় তলা (জনসংখ্যা বিজ্ঞান বিভাগের পাশে), ঢাকা বিশ্ববিদ্যালয়', en: '3rd Floor, Arts Building (beside Population Science), University of Dhaka' },
    how: { bn: 'ফি ও সেবার সময় ওয়েবসাইটে নেই, ফোন করে জেনে নিন। ওয়েবসাইটের যোগাযোগ পাতা বা হোয়াটসঅ্যাপেও যোগাযোগ করা যায়।', en: 'Fees and service hours are not listed online, so call to ask. You can also use the website’s contact page or WhatsApp.' },
    web: { url: 'https://npudu.org', label: 'npudu.org' },
    source: 'npudu.org',
    checked: '2026-10-25',
  },
];
