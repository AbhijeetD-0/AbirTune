import { Album, Track, Artist } from '../types';

/**
 * Helper to generate authentic Devotional Track
 */
export const createDevotionalTrack = (
  id: string,
  title: string,
  artist: string,
  album: string,
  duration: number,
  coverUrl: string,
  videoId: string,
  deity: 'Durga' | 'Kali' | 'Ganesha' | 'Shiva' | 'Krishna' | 'Hanuman' | 'Universal',
  language: 'Bengali' | 'Hindi' | 'Sanskrit' | 'Tamil' | 'Telugu' = 'Hindi'
): Track => ({
  id,
  title,
  artist,
  album,
  duration,
  coverUrl: coverUrl || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80',
  accentColor: deity === 'Kali' ? '#831843' : deity === 'Durga' ? '#b91c1c' : deity === 'Ganesha' ? '#ea580c' : deity === 'Shiva' ? '#0284c7' : '#d97706',
  secondaryColor: '#f59e0b',
  genre: 'Devotional / Bhaktigeeti',
  releaseYear: 2024,
  plays: `${(Math.random() * 30 + 15).toFixed(1)}M`,
  videoId,
  type: 'song',
  streamSource: 'youtube',
  moodCategory: 'Bhakti',
  bpm: 80,
});

// High-resolution studio artwork for Devotional collections
export const DURGA_MAHALAYA_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/31/35/67/31356783-71bc-7848-eb6e-e9392237894a/8902894353076_cover.jpg/600x600bb.jpg';
export const KALI_SHYAMA_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/9a/c0/83/9ac08365-1d4a-a384-3670-652317135e6c/8902894353106_cover.jpg/600x600bb.jpg';
export const DURGA_AGAMANI_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/bf/20/0e/bf200ea8-48b2-5f60-beba-3a67d0f9831d/8902894353083_cover.jpg/600x600bb.jpg';
export const GANESH_AARTI_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9f/9d/b0/9f9db035-656e-b0c5-d3d1-b933e0fef037/192562250242.jpg/600x600bb.jpg';
export const HANUMAN_CHALISA_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/85/ec/3b/85ec3b5f-2b28-dbec-647d-f25413bc0fa6/8901854000010_cover.jpg/600x600bb.jpg';
export const SHIV_TANDAV_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/11/4a/12/114a123f-e1eb-156c-0fc8-ba7bb9fa7bfa/8903431872111_cover.jpg/600x600bb.jpg';
export const KRISHNA_BHAJAN_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a7/b8/91/a7b8915b-9d48-cb54-8e6f-fb94e1d520e5/8902894353090_cover.jpg/600x600bb.jpg';
export const SOUTH_BHAKTI_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/8e/31/35/8e313589-71bc-7848-eb6e-e9392237894a/8902894353052_cover.jpg/600x600bb.jpg';

// ==========================================
// 1. Mahishasuramardini (Durga Puja Agamani & Mahalaya)
// The immortal dawn classic ushering Bengal's Durga Puja
// ==========================================
export const MAHALAYA_TRACKS: Track[] = [
  createDevotionalTrack('bhakti-mah-1', 'Ya Devi Sarvabhuteshu (Chandi Path)', 'Birendra Krishna Bhadra', 'Mahishasuramardini', 315, DURGA_MAHALAYA_COVER, 'b0-v2mCj8_A', 'Durga', 'Bengali'),
  createDevotionalTrack('bhakti-mah-2', 'Bajlo Tomar Alor Benu', 'Supriti Ghosh, Pankaj Mullick', 'Mahishasuramardini', 242, DURGA_MAHALAYA_COVER, 'T31RjE_fG8M', 'Durga', 'Bengali'),
  createDevotionalTrack('bhakti-mah-3', 'Jago Durga Jago Dashapraharanadharini', 'Dwijen Mukherjee, Pankaj Mullick', 'Mahishasuramardini', 285, DURGA_MAHALAYA_COVER, 'W5G_9m0p8kI', 'Durga', 'Bengali'),
  createDevotionalTrack('bhakti-mah-4', 'Rupang Dehi Jayang Dehi', 'Birendra Krishna Bhadra, Chorus', 'Mahishasuramardini', 260, DURGA_MAHALAYA_COVER, 'R7hF2w8z0rY', 'Durga', 'Bengali'),
  createDevotionalTrack('bhakti-mah-5', 'Aham Rudrebhir Vasubhischara', 'Birendra Krishna Bhadra', 'Mahishasuramardini', 290, DURGA_MAHALAYA_COVER, 'Y2mN4_b8V9c', 'Durga', 'Bengali'),
  createDevotionalTrack('bhakti-mah-6', 'Tabo Shubo Shankho Dhwani', 'Pankaj Mullick', 'Mahishasuramardini', 230, DURGA_MAHALAYA_COVER, 'b0-v2mCj8_A', 'Durga', 'Bengali'),
];

// ==========================================
// 2. Shyama Sangeet & Kali Bhaktigeeti
// The immortal Kali Kirtans and songs of Maa Tara & Shyama Maa
// ==========================================
export const SHYAMA_SANGEET_TRACKS: Track[] = [
  createDevotionalTrack('bhakti-shy-1', 'Mayer Payer Jaba Hoye', 'Pannalal Bhattacharya', 'Shyama Sangeet', 270, KALI_SHYAMA_COVER, 'ZqR1x3B4v1o', 'Kali', 'Bengali'),
  createDevotionalTrack('bhakti-shy-2', 'Ami Sakol Karmer Mul (Amar Maa)', 'Pannalal Bhattacharya', 'Shyama Sangeet', 288, KALI_SHYAMA_COVER, 'uK2s8m0v1rT', 'Kali', 'Bengali'),
  createDevotionalTrack('bhakti-shy-3', 'Basan Paro Maa (Shyama Maa)', 'Pannalal Bhattacharya', 'Shyama Sangeet', 255, KALI_SHYAMA_COVER, 'pW9x2b1c4rA', 'Kali', 'Bengali'),
  createDevotionalTrack('bhakti-shy-4', 'Shyama Maa Ki Amar Kalo', 'Dhananjay Bhattacharya', 'Shyama Sangeet', 264, KALI_SHYAMA_COVER, 'mN4v9b2c1zY', 'Kali', 'Bengali'),
  createDevotionalTrack('bhakti-shy-5', 'Tara Maa Go Amar Moner Kotha', 'Pannalal Bhattacharya', 'Shyama Sangeet', 310, KALI_SHYAMA_COVER, 'b8x1m9v2z4Q', 'Kali', 'Bengali'),
  createDevotionalTrack('bhakti-shy-6', 'Bhab Shindhu Tarane Shudhu Mayer Naam', 'Ramkumar Chattopadhyay', 'Shyama Sangeet', 245, KALI_SHYAMA_COVER, 'k9m2v8c1z3X', 'Kali', 'Bengali'),
];

// ==========================================
// 3. Durga Puja Agamani & Bangla Bhakti
// Modern Agamani songs celebrating Maa Durga's homecoming
// ==========================================
export const DURGA_AGAMANI_TRACKS: Track[] = [
  createDevotionalTrack('bhakti-dur-1', 'Aigiri Nandini (Mahishasura Mardini Stotram)', 'Anuradha Paudwal, Chorus', 'Durga Puja Bhaktigeeti', 380, DURGA_AGAMANI_COVER, 'X2_k4b9m0wQ', 'Durga', 'Sanskrit'),
  createDevotionalTrack('bhakti-dur-2', 'Durgatinashini Durga', 'Kumar Sanu, Sadhana Sargam', 'Durga Puja Bhaktigeeti', 290, DURGA_AGAMANI_COVER, 'n7m2b9v1x3Y', 'Durga', 'Bengali'),
  createDevotionalTrack('bhakti-dur-3', 'Dhak Bajlo Kasi Bajlo (Dugga Elo)', 'Shreya Ghoshal, Jeet Gannguli', 'Durga Puja Bhaktigeeti', 265, DURGA_AGAMANI_COVER, 'k8m1b2v9z4Q', 'Durga', 'Bengali'),
  createDevotionalTrack('bhakti-dur-4', 'Joy Maa Durga Jayanti Mangala', 'Anuradha Paudwal', 'Durga Puja Bhaktigeeti', 315, DURGA_AGAMANI_COVER, 'y3m9b1v2z4A', 'Durga', 'Bengali'),
  createDevotionalTrack('bhakti-dur-5', 'Sarva Mangala Mangalye', 'Lata Mangeshkar', 'Durga Puja Bhaktigeeti', 240, DURGA_AGAMANI_COVER, 'c7b2m9v1z3X', 'Durga', 'Sanskrit'),
];

// ==========================================
// 4. Shree Ganesh Mahotsav & Aarti Sangrah
// Sacred Ganesh Aartis, Stuti, and Atharvashirsha
// ==========================================
export const GANESH_AARTI_TRACKS: Track[] = [
  createDevotionalTrack('bhakti-gan-1', 'Sukhkarta Dukhharta (Shree Ganesh Aarti)', 'Lata Mangeshkar', 'Ganesh Mahotsav', 255, GANESH_AARTI_COVER, '1F3hm63IHvQ', 'Ganesha', 'Hindi'),
  createDevotionalTrack('bhakti-gan-2', 'Jai Ganesh Deva (Aarti)', 'Anuradha Paudwal', 'Ganesh Mahotsav', 280, GANESH_AARTI_COVER, 'mN2v8b1z4qY', 'Ganesha', 'Hindi'),
  createDevotionalTrack('bhakti-gan-3', 'Shendur Lal Chadhayo', 'Ravindra Sathe, Shankar Mahadevan', 'Ganesh Mahotsav', 245, GANESH_AARTI_COVER, 'k9b1v2z4m3Q', 'Ganesha', 'Hindi'),
  createDevotionalTrack('bhakti-gan-4', 'Ganesh Gayatri Mantra (Om Gan Ganapataye Namaha)', 'Suresh Wadkar', 'Ganesh Mahotsav', 360, GANESH_AARTI_COVER, 'pW2m9b1v4zX', 'Ganesha', 'Sanskrit'),
  createDevotionalTrack('bhakti-gan-5', 'Mourya Re Bappa', 'Shankar Mahadevan', 'Don / Ganesh Bhakti', 345, GANESH_AARTI_COVER, 'r7m2b9v1z3Y', 'Ganesha', 'Hindi'),
];

// ==========================================
// 5. Shree Hanuman Chalisa & Sankat Mochan
// ==========================================
export const HANUMAN_CHALISA_TRACKS: Track[] = [
  createDevotionalTrack('bhakti-han-1', 'Shree Hanuman Chalisa', 'Hariharan, Gulshan Kumar', 'Shree Hanuman Chalisa', 585, HANUMAN_CHALISA_COVER, 'AETFvQonfV8', 'Hanuman', 'Hindi'),
  createDevotionalTrack('bhakti-han-2', 'Sankat Mochan Hanuman Ashtak', 'Hariharan', 'Shree Hanuman Chalisa', 370, HANUMAN_CHALISA_COVER, 'b2m9v1z4q3Y', 'Hanuman', 'Hindi'),
  createDevotionalTrack('bhakti-han-3', 'Bajrang Baan', 'Anuradha Paudwal, Hariharan', 'Shree Hanuman Chalisa', 415, HANUMAN_CHALISA_COVER, 'k8m2b1v9z4A', 'Hanuman', 'Hindi'),
  createDevotionalTrack('bhakti-han-4', 'Hey Dukh Bhanjan Maruti Nandan', 'Hariharan', 'Shree Hanuman Chalisa', 320, HANUMAN_CHALISA_COVER, 'mN4v9b2c1zY', 'Hanuman', 'Hindi'),
];

// ==========================================
// 6. Shiv Tandav & Maha Mrityunjaya
// Sacred Shiva Stotrams, Rhythms & Mantras
// ==========================================
export const SHIV_ARADHANA_TRACKS: Track[] = [
  createDevotionalTrack('bhakti-shi-1', 'Shiv Tandav Stotram', 'Shankar Mahadevan', 'Shiv Aradhana', 552, SHIV_TANDAV_COVER, 'P_z_y3_JqF8', 'Shiva', 'Sanskrit'),
  createDevotionalTrack('bhakti-shi-2', 'Maha Mrityunjaya Mantra (Om Tryambakam)', 'Shankar Sahney, Anuradha Paudwal', 'Shiv Aradhana', 420, SHIV_TANDAV_COVER, 'y3m9b1v2z4A', 'Shiva', 'Sanskrit'),
  createDevotionalTrack('bhakti-shi-3', 'Karpur Gauram Karunavataram', 'Anuradha Paudwal', 'Shiv Aradhana', 290, SHIV_TANDAV_COVER, 'n7m2b9v1x3Y', 'Shiva', 'Sanskrit'),
  createDevotionalTrack('bhakti-shi-4', 'Namami Shamishan Nirvan Roopam (Rudrashtakam)', 'Ramesh Narayan', 'Shiv Aradhana', 345, SHIV_TANDAV_COVER, 'c7b2m9v1z3X', 'Shiva', 'Sanskrit'),
  createDevotionalTrack('bhakti-shi-5', 'Har Har Shambhu Shiv Mahadeva', 'Jeetu Sharma, Abhilipsa Panda', 'Shiv Aradhana', 335, SHIV_TANDAV_COVER, 'pW9x2b1c4rA', 'Shiva', 'Hindi'),
];

// ==========================================
// 7. Shree Krishna Bhajans & Kirtan
// ==========================================
export const KRISHNA_BHAJAN_TRACKS: Track[] = [
  createDevotionalTrack('bhakti-kri-1', 'Achyutam Keshavam Krishna Damodaram', 'Jagjit Singh, Chitra Singh', 'Krishna Bhajans', 385, KRISHNA_BHAJAN_COVER, 'ZqR1x3B4v1o', 'Krishna', 'Hindi'),
  createDevotionalTrack('bhakti-kri-2', 'Radhe Radhe Govinda Gopala Radhe', 'Anup Jalota', 'Krishna Bhajans', 420, KRISHNA_BHAJAN_COVER, 'mN4v9b2c1zY', 'Krishna', 'Hindi'),
  createDevotionalTrack('bhakti-kri-3', 'Hari Bol Hari Bol (Bengali Kirtan)', 'Shreya Ghoshal, Chorus', 'Krishna Bhajans', 310, KRISHNA_BHAJAN_COVER, 'k8m1b2v9z4Q', 'Krishna', 'Bengali'),
  createDevotionalTrack('bhakti-kri-4', 'Maiya Mori Main Nahi Makhan Khayo', 'Anup Jalota', 'Krishna Bhajans', 460, KRISHNA_BHAJAN_COVER, 'b8x1m9v2z4Q', 'Krishna', 'Hindi'),
  createDevotionalTrack('bhakti-kri-5', 'Shree Krishna Govind Hare Murari', 'Ravindra Jain, Hemlata', 'Krishna Bhajans', 350, KRISHNA_BHAJAN_COVER, 'y3m9b1v2z4A', 'Krishna', 'Hindi'),
];

// ==========================================
// 8. South Bhakti & Suprabhatam
// ==========================================
export const SOUTH_BHAKTI_TRACKS: Track[] = [
  createDevotionalTrack('bhakti-sou-1', 'Sri Venkateswara Suprabhatam', 'M.S. Subbulakshmi', 'South Divine Bhakti', 1230, SOUTH_BHAKTI_COVER, 'k9b1v2z4m3Q', 'Universal', 'Sanskrit'),
  createDevotionalTrack('bhakti-sou-2', 'Harivarasanam (Swamiye Saranam Ayyappa)', 'K.J. Yesudas', 'South Divine Bhakti', 315, SOUTH_BHAKTI_COVER, 'r7m2b9v1z3Y', 'Universal', 'Tamil'),
  createDevotionalTrack('bhakti-sou-3', 'Kandha Sashti Kavasam', 'Sulamangalam Sisters', 'South Divine Bhakti', 780, SOUTH_BHAKTI_COVER, 'pW2m9b1v4zX', 'Universal', 'Tamil'),
  createDevotionalTrack('bhakti-sou-4', 'Govinda Namalu', 'S.P. Balasubrahmanyam', 'South Divine Bhakti', 410, SOUTH_BHAKTI_COVER, 'mN2v8b1z4qY', 'Universal', 'Telugu'),
];

// Master list of all Devotional Albums
export const DEVOTIONAL_ALBUMS: Album[] = [
  {
    id: 'album-mahishasuramardini',
    title: 'Mahishasuramardini (Durga Puja Agamani)',
    artist: 'Birendra Krishna Bhadra, Pankaj Mullick, Dwijen Mukherjee',
    year: 1931,
    coverUrl: DURGA_MAHALAYA_COVER,
    trackCount: MAHALAYA_TRACKS.length,
    accentColor: '#DC2626',
    language: 'Bengali',
    genre: 'Durga Puja Mahalaya Classic',
    tracks: MAHALAYA_TRACKS,
  },
  {
    id: 'album-shyama-sangeet',
    title: 'Shyama Sangeet & Kali Bhaktigeeti',
    artist: 'Pannalal Bhattacharya, Dhananjay Bhattacharya',
    year: 1965,
    coverUrl: KALI_SHYAMA_COVER,
    trackCount: SHYAMA_SANGEET_TRACKS.length,
    accentColor: '#831843',
    language: 'Bengali',
    genre: 'Maa Kali Devotional Kirtan',
    tracks: SHYAMA_SANGEET_TRACKS,
  },
  {
    id: 'album-durga-puja-bhaktigeeti',
    title: 'Durga Puja Agamani & Bangla Bhakti',
    artist: 'Anuradha Paudwal, Kumar Sanu, Shreya Ghoshal',
    year: 2022,
    coverUrl: DURGA_AGAMANI_COVER,
    trackCount: DURGA_AGAMANI_TRACKS.length,
    accentColor: '#EA580C',
    language: 'Bengali',
    genre: 'Durga Puja Agamani Melodies',
    tracks: DURGA_AGAMANI_TRACKS,
  },
  {
    id: 'album-ganesh-mahotsav',
    title: 'Shree Ganesh Mahotsav & Aarti Sangrah',
    artist: 'Lata Mangeshkar, Anuradha Paudwal, Shankar Mahadevan',
    year: 2020,
    coverUrl: GANESH_AARTI_COVER,
    trackCount: GANESH_AARTI_TRACKS.length,
    accentColor: '#F97316',
    language: 'Hindi',
    genre: 'Ganesh Chaturthi Sacred Aartis',
    tracks: GANESH_AARTI_TRACKS,
  },
  {
    id: 'album-hanuman-chalisa',
    title: 'Shree Hanuman Chalisa & Sankat Mochan',
    artist: 'Hariharan, Gulshan Kumar',
    year: 1997,
    coverUrl: HANUMAN_CHALISA_COVER,
    trackCount: HANUMAN_CHALISA_TRACKS.length,
    accentColor: '#D97706',
    language: 'Hindi',
    genre: 'Sacred Hanuman Chants & Stotras',
    tracks: HANUMAN_CHALISA_TRACKS,
  },
  {
    id: 'album-shiv-aradhana',
    title: 'Shiv Tandav & Maha Mrityunjaya',
    artist: 'Shankar Mahadevan, Anuradha Paudwal',
    year: 2021,
    coverUrl: SHIV_TANDAV_COVER,
    trackCount: SHIV_ARADHANA_TRACKS.length,
    accentColor: '#0284C7',
    language: 'Sanskrit',
    genre: 'Cosmic Shiva Stotras & Mantras',
    tracks: SHIV_ARADHANA_TRACKS,
  },
  {
    id: 'album-krishna-bhajan',
    title: 'Shree Krishna Bhajans & Kirtan',
    artist: 'Jagjit Singh, Anup Jalota, Shreya Ghoshal',
    year: 2018,
    coverUrl: KRISHNA_BHAJAN_COVER,
    trackCount: KRISHNA_BHAJAN_TRACKS.length,
    accentColor: '#0D9488',
    language: 'Hindi',
    genre: 'Devotional Krishna Melodies',
    tracks: KRISHNA_BHAJAN_TRACKS,
  },
  {
    id: 'album-south-bhakti',
    title: 'South Divine Chants & Suprabhatam',
    artist: 'M.S. Subbulakshmi, K.J. Yesudas, S.P. Balasubrahmanyam',
    year: 2015,
    coverUrl: SOUTH_BHAKTI_COVER,
    trackCount: SOUTH_BHAKTI_TRACKS.length,
    accentColor: '#B45309',
    language: 'South',
    genre: 'Classical Carnatic Devotion',
    tracks: SOUTH_BHAKTI_TRACKS,
  },
];

// All devotional tracks combined
export const ALL_DEVOTIONAL_TRACKS: Track[] = [
  ...MAHALAYA_TRACKS,
  ...SHYAMA_SANGEET_TRACKS,
  ...DURGA_AGAMANI_TRACKS,
  ...GANESH_AARTI_TRACKS,
  ...HANUMAN_CHALISA_TRACKS,
  ...SHIV_ARADHANA_TRACKS,
  ...KRISHNA_BHAJAN_TRACKS,
  ...SOUTH_BHAKTI_TRACKS,
];

// Legendary Devotional Artists
export const DEVOTIONAL_ARTISTS: Artist[] = [
  {
    id: 'artist-birendra-krishna',
    name: 'Birendra Krishna Bhadra',
    monthlyListeners: '12.4M devotees',
    avatarUrl: DURGA_MAHALAYA_COVER,
    imageUrl: DURGA_MAHALAYA_COVER,
    bannerUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&auto=format&fit=crop&q=80',
    genre: 'The Voice of Mahalaya / Chandi Path',
    language: 'Bengali',
    role: 'Immortal Orator & Sacred Chandi Reciter',
    tracks: MAHALAYA_TRACKS,
  },
  {
    id: 'artist-pannalal',
    name: 'Pannalal Bhattacharya',
    monthlyListeners: '9.8M devotees',
    avatarUrl: KALI_SHYAMA_COVER,
    imageUrl: KALI_SHYAMA_COVER,
    bannerUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1200&auto=format&fit=crop&q=80',
    genre: 'King of Shyama Sangeet & Kali Bhakti',
    language: 'Bengali',
    role: 'Pioneering Devotional Maestro',
    tracks: SHYAMA_SANGEET_TRACKS,
  },
  {
    id: 'artist-anuradha-paudwal',
    name: 'Anuradha Paudwal',
    monthlyListeners: '24.6M devotees',
    avatarUrl: DURGA_AGAMANI_COVER,
    imageUrl: DURGA_AGAMANI_COVER,
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    genre: 'Queen of Aartis, Bhajans & Gayatri Mantra',
    language: 'Hindi',
    role: 'Padma Shri Bhakti Singer',
    tracks: [...DURGA_AGAMANI_TRACKS, ...GANESH_AARTI_TRACKS],
  },
  {
    id: 'artist-hariharan',
    name: 'Hariharan',
    monthlyListeners: '18.2M listeners',
    avatarUrl: HANUMAN_CHALISA_COVER,
    imageUrl: HANUMAN_CHALISA_COVER,
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    genre: 'Hanuman Chalisa Legend / Ghazals & Classical',
    language: 'Hindi',
    role: 'Renowned Playback Singer & Composer',
    tracks: HANUMAN_CHALISA_TRACKS,
  },
];

/**
 * Check if a track is a devotional / Bhaktigeeti track
 */
export function isDevotionalTrack(track?: Track | null): boolean {
  if (!track) return false;
  if (track.moodCategory === 'Bhakti' || track.genre?.toLowerCase().includes('devotional') || track.genre?.toLowerCase().includes('bhakti')) {
    return true;
  }
  const text = `${track.title || ''} ${track.artist || ''} ${track.album || ''}`.toLowerCase();
  const devotionalTerms = [
    'bhajan',
    'bhakti',
    'bhaktigeeti',
    'durga',
    'kali',
    'shyama',
    'ganesh',
    'ganesha',
    'ganpati',
    'shiva',
    'shiv',
    'krishna',
    'hanuman',
    'aarti',
    'chalisa',
    'stotram',
    'stuti',
    'mantra',
    'kirtan',
    'agamani',
    'mahalaya',
    'chandi path',
    'birendra krishna bhadra',
    'pannalal',
    'dhananjay bhattacharya',
    'suprabhatam',
    'harivarasanam',
    'mahishasura mardini',
    'aigiri nandini',
    'sukhkarta',
    'rudrashtakam',
    'achyutam',
  ];
  return devotionalTerms.some((term) => text.includes(term));
}

/**
 * Evaluate user's listening habits for Devotional music
 */
export function checkDevotionalHabits(
  recentTracks: Track[] = [],
  likedTrackIds: string[] = []
): {
  hasDevotionalPreference: boolean;
  affinityRatio: number;
  recentDevotionalTracks: Track[];
} {
  if (!recentTracks || recentTracks.length === 0) {
    return { hasDevotionalPreference: false, affinityRatio: 0, recentDevotionalTracks: [] };
  }

  const devotionalPlayed = recentTracks.filter(isDevotionalTrack);
  const devotionalLikedCount = recentTracks.filter(
    (t) => likedTrackIds.includes(t.id) && isDevotionalTrack(t)
  ).length;

  const totalEvaluated = recentTracks.length;
  const score = (devotionalPlayed.length + devotionalLikedCount * 1.5) / Math.max(1, totalEvaluated);

  return {
    hasDevotionalPreference: devotionalPlayed.length >= 1 || devotionalLikedCount >= 1,
    affinityRatio: Math.min(1, score),
    recentDevotionalTracks: devotionalPlayed,
  };
}
