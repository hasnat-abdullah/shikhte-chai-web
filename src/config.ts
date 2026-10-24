// Site-wide settings. Optional values are hidden in the UI until they are filled in.
export const SITE = {
  url: 'https://shikhtechai.com',
  youtube: 'https://www.youtube.com/@ShikhteChaiBD',
  // Form service key (Web3Forms), set as PUBLIC_WEB3FORMS_KEY. Messages are delivered to the inbox the key was created for.
  formKey: import.meta.env.PUBLIC_WEB3FORMS_KEY ?? '',
  // YouTube Data API key (restricted to this domain) for live view and comment counts. Set as PUBLIC_YOUTUBE_API_KEY.
  ytKey: import.meta.env.PUBLIC_YOUTUBE_API_KEY ?? '',
  // Supabase project that stores professionals' listings (see supabase/migrations). Both values are public by design;
  // the database's row-level security decides what visitors can read and write.
  supabase: { url: import.meta.env.PUBLIC_SUPABASE_URL ?? '', key: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '' },
  facebook: 'https://www.facebook.com/shikhtechaibd/',
  // Kaan Pete Roi: independent national emotional-support and suicide-prevention helpline.
  // Number and hours confirmed from kaanpeteroi.org/helpline-service, Lifeline International and The Daily Star (Oct 2026).
  helpline: {
    number: '09612119911',
    display: '09612-119911',
    facebook: 'https://www.facebook.com/kaan.pete.roi/',
    // Daily window in Bangladesh time (UTC+6): 15:00 to 03:00 the next day.
    openHour: 15,
    closeHour: 3,
  },
  emergencyNumber: '999',
};
