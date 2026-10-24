export type Lang = 'bn' | 'en';
export type Shelf = 'mental' | 'science';

export interface Category {
  id: string;
  shelf: Shelf;
  bn: string;
  en: string;
  descBn: string;
  descEn: string;
  bg: string;
  ink: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'anxiety', shelf: 'mental', bn: 'দুশ্চিন্তা ও ভীতি', en: 'Anxiety & Fear', descBn: 'প্যানিক অ্যাটাক, সামাজিক ভীতি, OCD ও সারাক্ষণ দুশ্চিন্তা', descEn: 'Panic attacks, social phobia, OCD and constant worry', bg: '#E3EEF6', ink: '#1F4A68', icon: 'M3 12h4l3-7 4 14 3-7h4' },
  { id: 'mood', shelf: 'mental', bn: 'বিষণ্ণতা ও আত্মহত্যা প্রতিরোধ', en: 'Depression & Suicide Prevention', descBn: 'মন খারাপ থেকে বেরিয়ে আসা, ভুল ধারণা ভাঙা', descEn: 'Coming out of low mood, and breaking the myths', bg: '#ECE8F4', ink: '#44386B', icon: 'M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 18z' },
  { id: 'addiction', shelf: 'mental', bn: 'আসক্তি থেকে মুক্তি', en: 'Addiction & Recovery', descBn: 'নেশার টান, মোবাইল আসক্তি, আসক্তির বিজ্ঞান', descEn: 'Cravings, phone addiction and the science of addiction', bg: '#F6E8DC', ink: '#7A3E14', icon: 'M9 15l6-6M10.5 6.5l1.8-1.8a4 4 0 0 1 5.7 5.7l-1.8 1.8M13.5 17.5l-1.8 1.8a4 4 0 0 1-5.7-5.7l1.8-1.8' },
  { id: 'relationships', shelf: 'mental', bn: 'সম্পর্ক ও দাম্পত্য', en: 'Relationships & Marriage', descBn: 'দ্বন্দ্ব, ব্রেকআপ, দাম্পত্য কলহ, পরিবার', descEn: 'Conflict, breakups, marital disputes and family', bg: '#F6E4E7', ink: '#7A2E3E', icon: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 2.7-5 6-5s6 2 6 5M14.5 15.2c.5-.1 1-.2 1.5-.2 3.3 0 6 2 6 5' },
  { id: 'self', shelf: 'mental', bn: 'আত্মশক্তি ও আবেগ', en: 'Self-worth & Emotions', descBn: 'রাগ নিয়ন্ত্রণ, ‘না’ বলা, সমস্যা সমাধান', descEn: 'Anger control, saying no, solving problems', bg: '#E4F1E7', ink: '#2D5A3A', icon: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z' },
  { id: 'calm', shelf: 'mental', bn: 'শিথিলায়ন ও মাইন্ডফুলনেস', en: 'Relaxation & Mindfulness', descBn: 'PMR, রিলাক্সেশন ও মাইন্ডফুলনেস চর্চা', descEn: 'PMR, relaxation and mindfulness practice', bg: '#DFF0EE', ink: '#0B5A53', icon: 'M12 3c3 3 4 6 0 11-4-5-3-8 0-11zM4 13c3 0 6 1.5 8 5 2-3.5 5-5 8-5M3 20h18' },
  { id: 'parenting', shelf: 'mental', bn: 'শিশু ও প্যারেন্টিং', en: 'Children & Parenting', descBn: 'অটিজম, সন্তান লালনপালন, শিশুর সুরক্ষা', descEn: 'Autism, raising children, keeping them safe', bg: '#F7EFD6', ink: '#6A5210', icon: 'M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 10c0-3 2-5 6-5 0 3-2 5-6 5z' },
  { id: 'help', shelf: 'mental', bn: 'মানসিক স্বাস্থ্য বোঝা ও সাহায্য', en: 'Understanding & Getting Help', descBn: 'কুসংস্কার, কাউন্সেলিং, কখন কার কাছে যাবেন', descEn: 'Myths, counseling, when and whom to see', bg: '#E8EBEE', ink: '#33414D', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6' },
  { id: 'health', shelf: 'science', bn: 'স্বাস্থ্য ও শরীর', en: 'Health & Body', descBn: '', descEn: '', bg: '#FBEAE6', ink: '#8A2C22', icon: 'M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11zM8 12h2l1.5-3 2 6 1.5-3h2' },
  { id: 'tech', shelf: 'science', bn: 'বিজ্ঞান ও প্রযুক্তি', en: 'Science & Technology', descBn: '', descEn: '', bg: '#EAEAF6', ink: '#3A3F7A', icon: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9' },
  { id: 'study', shelf: 'science', bn: 'গণিত ও পড়াশোনা', en: 'Maths & Study', descBn: '', descEn: '', bg: '#F2EEE4', ink: '#5B4A1F', icon: 'M4 5h7v14H4zM13 5h7v14h-7M7 9h1M16 9h1M16 13h1' },
];

export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<string, Category>;
