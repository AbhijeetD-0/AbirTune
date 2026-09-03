import { Track } from '../types';

export interface LongFormItem {
  id: string;
  title: string;
  artist: string; // or speaker / curator
  duration: number; // in seconds (1800 to 3600 seconds, 30m to 1h)
  durationDisplay: string; // e.g., "52:00", "45:15", "48:20", "1:00:00"
  coverUrl: string;
  category: 'Continuous Mix' | 'Spiritual & Bhakti' | 'Discourse' | 'Meditation' | 'Regional';
  tag: string;
  description: string;
  videoId: string;
  accentColor: string;
  views: string;
  releaseYear: number;
}

export const LONG_FORM_ITEMS: LongFormItem[] = [
  {
    id: 'lf-mahalaya-full',
    title: 'Mahishasuramardini - Full Original Mahalaya Recitation',
    artist: 'Birendra Krishna Bhadra, Pankaj Mullick',
    duration: 3120, // 52 mins
    durationDisplay: '52:00',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/31/35/67/31356783-71bc-7848-eb6e-e9392237894a/8902894353076_cover.jpg/600x600bb.jpg',
    category: 'Spiritual & Bhakti',
    tag: 'MAHALAYA FULL',
    description: 'The complete, immortal Sanskrit Chandi Path, Agamani stotras & songs ushering Durga Puja at dawn.',
    videoId: 'b0-v2mCj8_A',
    accentColor: '#dc2626',
    views: '18.4M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-bolly-romantic-45m',
    title: 'Bollywood Romantic Melodies - 45 Min Non-Stop Acoustic Chill',
    artist: 'Arijit Singh, Pritam, Mithoon',
    duration: 2715, // 45:15
    durationDisplay: '45:15',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/600x600bb.jpg',
    category: 'Continuous Mix',
    tag: 'NON-STOP MIX',
    description: 'Uninterrupted soulful acoustic, soft piano, and intimate vocals of modern India’s greatest love anthems.',
    videoId: 'IJq0yyWug1k',
    accentColor: '#ff2d55',
    views: '9.2M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-hanuman-108-jaap',
    title: 'Shree Hanuman Chalisa - 108 Times Non-Stop Jaap & Chanting',
    artist: 'Hariharan, Gulshan Kumar',
    duration: 2900, // 48:20
    durationDisplay: '48:20',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/85/ec/3b/85ec3b5f-2b28-dbec-647d-f25413bc0fa6/8901854000010_cover.jpg/600x600bb.jpg',
    category: 'Spiritual & Bhakti',
    tag: '108 TIMES JAAP',
    description: 'Continuous sacred recitation of Hanuman Chalisa for deep focus, inner courage, resilience and mental peace.',
    videoId: 'AETFvQonfV8',
    accentColor: '#ea580c',
    views: '34.1M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-gita-discourse',
    title: 'Bhagavad Gita & The Science of Self - Spiritual Discourse',
    artist: 'Swami Sarvapriyananda & Vedantic Scholars',
    duration: 2280, // 38:00
    durationDisplay: '38:00',
    coverUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80',
    category: 'Discourse',
    tag: 'VEDANTA DISCOURSE',
    description: 'A calming and illuminating 38-minute lecture on inner tranquility, overcoming anxiety, and timeless Gita wisdom.',
    videoId: 'ZqR1x3B4v1o',
    accentColor: '#d97706',
    views: '4.7M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-shiv-tandav-meditation',
    title: 'Shiv Tandav & Cosmic Rudrashtakam - 1 Hour Meditative Trance',
    artist: 'Shankar Mahadevan, Anuradha Paudwal',
    duration: 3320, // 55:20
    durationDisplay: '55:20',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/11/4a/12/114a123f-e1eb-156c-0fc8-ba7bb9fa7bfa/8903431872111_cover.jpg/600x600bb.jpg',
    category: 'Spiritual & Bhakti',
    tag: 'SHIV MARATHON',
    description: 'Hypnotic continuous cosmic percussion, Sanskrit chanting, and meditative resonance dedicated to Lord Shiva.',
    videoId: 'P_z_y3_JqF8',
    accentColor: '#0284c7',
    views: '12.8M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-bangla-coffeehouse-50m',
    title: 'Bangla Coffee House Evergreen Melodies - 50 Min Nostalgia Flow',
    artist: 'Manna Dey, Hemanta Mukherjee, Kishore Kumar',
    duration: 3010, // 50:10
    durationDisplay: '50:10',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/bf/1a/06/bf1a067a-8f55-1f19-bfa6-8486981cf0ec/8902894353120_cover.jpg/600x600bb.jpg',
    category: 'Regional',
    tag: 'BANGLA CLASSICS',
    description: 'Continuous nostalgic retrospective through Bengal’s timeless romantic and philosophical golden era compositions.',
    videoId: '1t7jM_h-u0k',
    accentColor: '#8b5cf6',
    views: '6.5M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-south-symphony-45m',
    title: 'South Cinema Symphony: A.R. Rahman & Anirudh - 45 Min Journey',
    artist: 'A.R. Rahman, Anirudh Ravichander, Sid Sriram',
    duration: 2740, // 45:40
    durationDisplay: '45:40',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/8e/f8/85/8ef88544-a6c7-018b-0a75-dc3b6b024fa0/cover.jpg/600x600bb.jpg',
    category: 'Regional',
    tag: 'SOUTH SYMPHONY',
    description: 'Non-stop symphonic blend of Tamil & Telugu modern masterpieces, acoustic guitar solos, and rich brass arrangements.',
    videoId: 'yJ3N4h1Fw2A',
    accentColor: '#10b981',
    views: '8.3M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-shyama-sangeet-marathon',
    title: 'Shyama Sangeet & Kali Kirtan - 42 Min Non-Stop Devotional',
    artist: 'Pannalal Bhattacharya, Dhananjay Bhattacharya',
    duration: 2520, // 42:00
    durationDisplay: '42:00',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/9a/c0/83/9ac08365-1d4a-a384-3670-652317135e6c/8902894353106_cover.jpg/600x600bb.jpg',
    category: 'Spiritual & Bhakti',
    tag: 'KALI KIRTAN',
    description: 'Soul-stirring continuous collection of classic Shyama Sangeet celebrating Maa Kali and Maa Tara with pure devotion.',
    videoId: 'uK2s8m0v1rT',
    accentColor: '#be185d',
    views: '7.1M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-ganesh-aarti-jukebox',
    title: 'Shree Ganesh Aarti & Bhajans - 35 Min Divine Jukebox',
    artist: 'Lata Mangeshkar, Anuradha Paudwal, Shankar Mahadevan',
    duration: 2100, // 35:00
    durationDisplay: '35:00',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9f/9d/b0/9f9db035-656e-b0c5-d3d1-b933e0fef037/192562250242.jpg/600x600bb.jpg',
    category: 'Spiritual & Bhakti',
    tag: 'GANESH AARTI',
    description: 'Joyful non-stop Ganesh Chaturthi aartis including Sukhkarta Dukhharta, Shendur Lal Chadhayo and Atharvashirsha.',
    videoId: '1F3hm63IHvQ',
    accentColor: '#f97316',
    views: '11.5M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-bansuri-meditation-46m',
    title: 'Indian Classical Bansuri Flute Ragas - 46 Min Deep Meditation',
    artist: 'Pt. Hariprasad Chaurasia, Rakesh Chaurasia',
    duration: 2760, // 46:00
    durationDisplay: '46:00',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    category: 'Meditation',
    tag: 'BANSURI PEACE',
    description: 'Deep, uninterrupted Indian bamboo flute improvisations in Raga Yaman and Bhairav for stress relief and contemplation.',
    videoId: 'k9b1v2z4m3Q',
    accentColor: '#059669',
    views: '5.9M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-krishna-kirtan-50m',
    title: 'Radhe Krishna Mahamantra & Kirtan - 50 Min Continuous Flow',
    artist: 'Jagjit Singh, Chitra Singh, Anup Jalota',
    duration: 3000, // 50:00
    durationDisplay: '50:00',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a7/b8/91/a7b8915b-9d48-cb54-8e6f-fb94e1d520e5/8902894353090_cover.jpg/600x600bb.jpg',
    category: 'Spiritual & Bhakti',
    tag: 'KRISHNA KIRTAN',
    description: 'Serene continuous harmonium and tabla kirtan chanting Achyutam Keshavam and Hare Krishna mahamantra.',
    videoId: 'mN4v9b2c1zY',
    accentColor: '#0d9488',
    views: '8.8M views',
    releaseYear: 2024,
  },
  {
    id: 'lf-lofi-chill-40m',
    title: 'Midnight Bollywood Lo-Fi - 40 Min Study & Unwind Stream',
    artist: 'AbirTune Lo-Fi Collective',
    duration: 2400, // 40:00
    durationDisplay: '40:00',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    category: 'Continuous Mix',
    tag: 'CHILL LO-FI',
    description: 'Warm vinyl crackle, gentle rain texture, and slowed-down reverb Bollywood melodies for nighttime focus.',
    videoId: 'BddP6PYo2gs',
    accentColor: '#6366f1',
    views: '4.2M views',
    releaseYear: 2024,
  },
];

/**
 * Convert a LongFormItem into a fully compliant Track object for playback
 */
export function convertLongFormToTrack(item: LongFormItem): Track {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    album: `${item.category} • Long-form`,
    duration: item.duration,
    coverUrl: item.coverUrl,
    accentColor: item.accentColor,
    secondaryColor: '#f59e0b',
    genre: item.category,
    releaseYear: item.releaseYear || 2024,
    plays: item.views,
    videoId: item.videoId,
    type: 'song',
    streamSource: 'youtube',
    moodCategory: item.category === 'Spiritual & Bhakti' || item.category === 'Discourse' ? 'Bhakti' : 'Relax',
    bpm: 75,
  };
}

/**
 * Convert all LongFormItems to Tracks for queue management
 */
export function getAllLongFormTracks(): Track[] {
  return LONG_FORM_ITEMS.map(convertLongFormToTrack);
}
