import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Mic,
  X,
  TrendingUp,
  Sparkles,
  Music2,
  ArrowUpRight,
  Loader2,
  Disc,
  Play,
} from 'lucide-react';
import { Track, Album, Artist } from '../types';
import { TrackCard } from './TrackCard';
import { searchTracks, fetchSearchSuggestions, getTrendingMusic } from '../services/api';
import { ALBUMS, TOP_ARTISTS } from '../data/mockMusic';
import { handleImageError } from '../data/imageFallback';

interface SearchViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, customQueue?: Track[], fromQueue?: boolean, isRadioMode?: boolean) => void;
  onToggleLike: (trackId: string, e: React.MouseEvent) => void;
  onOpenMenu: (track: Track, e: React.MouseEvent) => void;
  onSelectAlbum?: (album: Album) => void;
  onSelectArtist?: (artist: Artist) => void;
}

const TRENDING_SEARCHES = [
  'Arijit Singh',
  'Bengali songs',
  'Chander Pahar',
  'Mahishasuramardini',
  'Hanuman Chalisa',
  'Leo Tamil songs',
  'Telugu hits',
  'Baishe Srabon',
  'Devara songs',
  'Ganesh Aarti',
  'KGF Chapter 2',
  'Tum Hi Ho',
  'Shiv Tandav',
  'Anupam Roy',
  'Ala Vaikunthapurramuloo',
];

const GENRE_BROWSE_CARDS = [
  { name: 'Bhakti & Devotional', query: 'Bhakti Devotional songs', color: 'from-amber-600 to-orange-700', icon: '🪔' },
  { name: 'Bollywood Hits', query: 'Bollywood Hits', color: 'from-amber-600 to-rose-700', icon: '🎬' },
  { name: 'Bengali Melodies', query: 'Bengali Songs', color: 'from-purple-600 to-indigo-700', icon: '🎵' },
  { name: 'Tamil & Kollywood', query: 'Tamil Hits', color: 'from-emerald-600 to-teal-700', icon: '🔥' },
  { name: 'Telugu & Tollywood', query: 'Telugu Songs', color: 'from-orange-600 to-amber-700', icon: '🌟' },
  { name: 'Romantic & Love', query: 'Romantic Hits', color: 'from-rose-600 to-pink-700', icon: '❤️' },
  { name: 'Punjabi Beats', query: 'Punjabi Hits', color: 'from-red-600 to-yellow-600', icon: '🥁' },
  { name: 'Bhojpuri Dhamaka', query: 'Bhojpuri Songs', color: 'from-yellow-600 to-lime-600', icon: '💥' },
  { name: 'Chill & Lo-Fi', query: 'Lo-Fi Chill Beats', color: 'from-indigo-600 to-purple-800', icon: '☕' },
];

export const SearchView: React.FC<SearchViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onToggleLike,
  onOpenMenu,
  onSelectAlbum,
  onSelectArtist,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [matchingAlbums, setMatchingAlbums] = useState<Album[]>([]);
  const [matchingArtists, setMatchingArtists] = useState<Artist[]>([]);
  const [searchTab, setSearchTab] = useState<'all' | 'songs' | 'albums' | 'artists'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const suggestTimeoutRef = useRef<number | null>(null);

  // Local query memoization cache to prevent redundant API hits on backspace/repeated terms
  const searchCacheRef = useRef<Map<string, Track[]>>(new Map());
  const suggestCacheRef = useRef<Map<string, string[]>>(new Map());

  // Match Artists or Actors from the catalog with multilingual coverage
  const findArtists = useCallback((searchQuery: string): Artist[] => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const cleanQ = q.replace(/\b(songs|song|hits|all|music|actor|singer|star|track|ost)\b/gi, '').trim();
    const isSouthQuery = /south|tamil|telugu|kannada|malayalam/i.test(q);
    const isBengaliQuery = /bengali|bangla/i.test(q);

    return TOP_ARTISTS.filter((a) => {
      const name = a.name.toLowerCase();
      const role = a.role ? a.role.toLowerCase() : '';
      const genre = a.genre ? a.genre.toLowerCase() : '';
      const lang = a.language ? a.language.toLowerCase() : '';

      if (isBengaliQuery && lang.includes('bengali')) return true;
      if (isSouthQuery && (lang.includes('south') || genre.includes('tamil') || genre.includes('telugu'))) return true;

      return (
        name.includes(q) ||
        role.includes(q) ||
        genre.includes(q) ||
        lang.includes(q) ||
        (cleanQ.length >= 2 && (name.includes(cleanQ) || cleanQ.includes(name)))
      );
    });
  }, []);

  // Search catalog tracks immediately for fast, high-quality, multilingual results
  const searchCatalogTracks = useCallback((searchQuery: string): Track[] => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const cleanQ = q.replace(/\b(songs|song|all|music|video|audio|hits|soundtrack|mp3)\b/gi, '').trim();
    const isBengali = /bengali|bangla/i.test(q);
    const isTamil = /tamil|kollywood/i.test(q);
    const isTelugu = /telugu|tollywood/i.test(q);
    const isSouth = /south|tamil|telugu|kannada/i.test(q);
    const isHindi = /hindi|bollywood/i.test(q);
    const isDevotional = /bhakti|bhajan|aarti|kirtan|stotram|devotional|durga|kali|shyama|ganesh|hanuman|shiv|krishna|mahalaya|chandi/i.test(q);

    const matchedTracks: Track[] = [];
    const seenIds = new Set<string>();

    const checkTrack = (track: Track, album?: Album) => {
      if (!track || seenIds.has(track.id)) return;
      const title = track.title.toLowerCase();
      const artist = track.artist.toLowerCase();
      const albumName = (track.album || '').toLowerCase();
      const albumLang = (album?.language || '').toLowerCase();
      const albumGenre = (album?.genre || '').toLowerCase();

      let match =
        title.includes(q) ||
        artist.includes(q) ||
        albumName.includes(q) ||
        albumLang.includes(q) ||
        albumGenre.includes(q) ||
        (cleanQ.length >= 2 && (title.includes(cleanQ) || artist.includes(cleanQ) || albumName.includes(cleanQ) || albumLang.includes(cleanQ) || albumGenre.includes(cleanQ)));

      if (!match) {
        if (isBengali && (albumLang.includes('bengali') || albumGenre.includes('bengali') || albumGenre.includes('bangla') || albumName.includes('bengali') || albumName.includes('bangla'))) match = true;
        else if (isTamil && (albumLang.includes('tamil') || albumGenre.includes('tamil') || albumGenre.includes('kollywood'))) match = true;
        else if (isTelugu && (albumLang.includes('telugu') || albumGenre.includes('telugu') || albumGenre.includes('tollywood'))) match = true;
        else if (isSouth && (albumLang.includes('south') || albumLang.includes('tamil') || albumLang.includes('telugu') || albumGenre.includes('kollywood') || albumGenre.includes('tollywood'))) match = true;
        else if (isHindi && (albumLang.includes('hindi') || albumGenre.includes('bollywood'))) match = true;
        else if (/jeet\s*gang/i.test(q) && (artist.includes('jeet') || albumName.includes('jeet') || albumName.includes('paglu') || albumName.includes('challenge'))) match = true;
        else if (/prosenjit|bumbada/i.test(q) && (artist.includes('prosenjit') || albumName.includes('prosenjit') || albumName.includes('autograph') || albumName.includes('praktan') || albumName.includes('baishe srabon'))) match = true;
        else if (/\bdev\b|deepak\s*adhikari/i.test(q) && (artist.includes('dev') || albumName.includes('chander') || albumName.includes('paglu') || albumName.includes('challenge') || albumName.includes('dui prithibi'))) match = true;
        else if (/chander\s*pahar/i.test(q) && (albumName.includes('chander') || title.includes('chander'))) match = true;
        else if (/shreya.*bengali|bengali.*shreya/i.test(q) && (artist.includes('shreya') && (albumLang.includes('bengali') || albumGenre.includes('bengali') || albumName.includes('bengali')))) match = true;
        else if (/master|vaathi/i.test(q) && (albumName.includes('master') || title.includes('vaathi'))) match = true;
        else if (/rrr|naatu\s*naatu/i.test(q) && (albumName.includes('rrr') || title.includes('naatu'))) match = true;
        else if (/pushpa\s*2|angaaron/i.test(q) && (albumName.includes('pushpa 2') || title.includes('angaaron') || title.includes('pushpa pushpa'))) match = true;
        else if (/mahalaya|mahishasuramardini|birendra|chandi\s*path/i.test(q) && (albumName.includes('mahishasura') || albumName.includes('mahalaya') || albumGenre.includes('mahalaya') || title.includes('devi') || title.includes('durga') || title.includes('benu') || title.includes('chandi') || artist.includes('birendra') || artist.includes('pankaj'))) match = true;
        else if (/krishna|achyutam|radhe|govinda/i.test(q) && (albumName.includes('krishna') || albumGenre.includes('krishna') || title.includes('krishna') || title.includes('radhe') || title.includes('govind') || title.includes('achyutam') || title.includes('hari bol'))) match = true;
        else if (/film\s*album|movie\s*album|soundtrack|full\s*album/i.test(q) && (albumGenre.includes('cinema') || albumGenre.includes('soundtrack') || albumGenre.includes('movie') || albumGenre.includes('classic') || albumName.includes('soundtrack') || albumName.includes('album'))) match = true;
        else if (isDevotional && (albumGenre.includes('devotional') || albumGenre.includes('sacred') || albumGenre.includes('mahalaya') || title.includes('aarti') || title.includes('chalisa') || title.includes('stotram') || title.includes('bhajan') || title.includes('devi') || title.includes('shiv') || title.includes('ganesh') || title.includes('krishna') || title.includes('kali') || title.includes('durga'))) match = true;
      }

      if (match) {
        seenIds.add(track.id);
        matchedTracks.push(track);
      }
    };

    // Check all albums tracks
    ALBUMS.forEach((alb) => {
      (alb.tracks || []).forEach((t) => checkTrack(t, alb));
    });

    // Check artist top tracks
    TOP_ARTISTS.forEach((art) => {
      (art.topTracks || art.tracks || []).forEach((t) => checkTrack(t));
    });

    return matchedTracks;
  }, []);

  // Smart Album Matching Algorithm:
  // Categorizes albums matching query keywords, movies, or artists
  const findAlbums = useCallback((searchQuery: string, songResults: Track[]): Album[] => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const cleanQ = q.replace(/\b(songs|song|album|all|movie|soundtrack|ost|mp3|audio|hits|theme)\b/gi, '').trim();

    // 1. Direct match in ALBUMS catalog (title, artist, language, genre, and tracks)
    const directMatches = ALBUMS.filter((alb) => {
      const title = alb.title.toLowerCase();
      const artist = alb.artist.toLowerCase();
      const language = (alb.language || '').toLowerCase();
      const genre = (alb.genre || '').toLowerCase();
      const hasTrackMatch = (alb.tracks || []).some(
        (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      );
      return (
        title.includes(q) ||
        artist.includes(q) ||
        language.includes(q) ||
        genre.includes(q) ||
        hasTrackMatch ||
        (cleanQ.length >= 2 && (title.includes(cleanQ) || cleanQ.includes(title)))
      );
    });

    // 2. Multilingual Movie / Franchise / Regional / Devotional Alias Matching:
    const aliasMatches: Album[] = [];

    // Devotional / Bhaktigeeti Aliases
    if (/bhakti|bhajan|aarti|kirtan|stotram|devotional|puja/i.test(q)) {
      ALBUMS.forEach((a) => {
        const ag = (a.genre || '').toLowerCase();
        if (
          (ag.includes('devotional') ||
            ag.includes('bhakti') ||
            ag.includes('sacred') ||
            ag.includes('bhajan') ||
            ag.includes('aarti') ||
            ag.includes('mahalaya') ||
            ag.includes('kirtan') ||
            a.id?.startsWith('album-durga') ||
            a.id?.startsWith('album-krishna') ||
            a.id?.startsWith('album-mahishasuramardini') ||
            a.id?.startsWith('album-shyama') ||
            a.id?.startsWith('album-shiv') ||
            a.id?.startsWith('album-ganesh') ||
            a.id?.startsWith('album-hanuman')) &&
          !directMatches.some((m) => m.id === a.id)
        ) {
          aliasMatches.push(a);
        }
      });
    }
    if (/durga|mahalaya|birendra|chandi|agamani|pankaj|dwijen|ya\s*devi|alor\s*benu/i.test(q)) {
      const dm = ALBUMS.find((a) => a.id === 'album-mahishasuramardini');
      const dp = ALBUMS.find((a) => a.id === 'album-durga-puja-bhaktigeeti');
      if (dm && !directMatches.some((m) => m.id === dm.id)) aliasMatches.unshift(dm);
      if (dp && !directMatches.some((m) => m.id === dp.id) && !aliasMatches.some((m) => m.id === dp.id)) aliasMatches.push(dp);
    }
    if (/kali|shyama|pannalal|mayer\s*payer|sakol\s*karmer|tara\s*maa/i.test(q)) {
      const sk = ALBUMS.find((a) => a.id === 'album-shyama-sangeet');
      if (sk && !directMatches.some((m) => m.id === sk.id)) aliasMatches.push(sk);
    }
    if (/ganesh|ganpati|sukhkarta|shendur|bappa/i.test(q)) {
      const gm = ALBUMS.find((a) => a.id === 'album-ganesh-mahotsav');
      if (gm && !directMatches.some((m) => m.id === gm.id)) aliasMatches.push(gm);
    }
    if (/hanuman|chalisa|sankat\s*mochan|bajrang\s*baan|hariharan/i.test(q)) {
      const hc = ALBUMS.find((a) => a.id === 'album-hanuman-chalisa');
      if (hc && !directMatches.some((m) => m.id === hc.id)) aliasMatches.push(hc);
    }
    if (/shiv|shiva|mahadev|tandav|rudrashtakam|mrityunjaya/i.test(q)) {
      const sa = ALBUMS.find((a) => a.id === 'album-shiv-aradhana');
      if (sa && !directMatches.some((m) => m.id === sa.id)) aliasMatches.push(sa);
    }
    if (/krishna|achyutam|radhe\s*radhe|radhe|govinda/i.test(q)) {
      const kb = ALBUMS.find((a) => a.id === 'album-krishna-bhajan');
      if (kb && !directMatches.some((m) => m.id === kb.id)) aliasMatches.unshift(kb);
    }
    if (/suprabhatam|venkateswara|harivarasanam|ayyappa|subbulakshmi/i.test(q)) {
      const sb = ALBUMS.find((a) => a.id === 'album-south-bhakti');
      if (sb && !directMatches.some((m) => m.id === sb.id)) aliasMatches.push(sb);
    }

    // Movie Albums & Film Soundtracks Aliases
    if (/film\s*album|movie\s*album|soundtrack|ost|full\s*album|cinema/i.test(q)) {
      ALBUMS.forEach((a) => {
        const ag = (a.genre || '').toLowerCase();
        const at = a.title.toLowerCase();
        if (
          (ag.includes('cinema') ||
            ag.includes('soundtrack') ||
            ag.includes('movie') ||
            ag.includes('blockbuster') ||
            at.includes('soundtrack') ||
            at.includes('album')) &&
          !directMatches.some((m) => m.id === a.id) &&
          !aliasMatches.some((m) => m.id === a.id)
        ) {
          aliasMatches.push(a);
        }
      });
    }

    // Bengali Aliases
    if (/bengali|bangla/i.test(q)) {
      ALBUMS.forEach((a) => {
        if (a.language === 'Bengali' && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/baishe\s*srabon|22\s*shey|benche\s*thakar|gobhire|ey\s*hawa/i.test(q)) {
      const bs = ALBUMS.find((a) => a.id === 'album-baishe-srabon');
      if (bs && !directMatches.some((m) => m.id === bs.id)) aliasMatches.push(bs);
    }
    if (/autograph|amake\s*amar|chal\s*rastay|bhebe\s*dekhechho/i.test(q)) {
      const auto = ALBUMS.find((a) => a.id === 'album-autograph');
      if (auto && !directMatches.some((m) => m.id === auto.id)) aliasMatches.push(auto);
    }
    if (/praktan|tumi\s*jaake|kolkata\s*kolkata|bhromor/i.test(q)) {
      const pr = ALBUMS.find((a) => a.id === 'album-praktan');
      if (pr && !directMatches.some((m) => m.id === pr.id)) aliasMatches.push(pr);
    }
    if (/bhooter\s*bhabishyat|bhooter/i.test(q)) {
      const bb = ALBUMS.find((a) => a.id === 'album-bhooter-bhabishyat');
      if (bb && !directMatches.some((m) => m.id === bb.id)) aliasMatches.push(bb);
    }
    if (/arijit.*bengali|bengali.*arijit|mon\s*majhi|bojhena|tomake\s*chai|ki\s*kore\s*toke/i.test(q)) {
      const ab = ALBUMS.find((a) => a.id === 'album-arijit-bengali');
      if (ab && !directMatches.some((m) => m.id === ab.id)) aliasMatches.push(ab);
    }
    if (/hemanta|hemant\s*kumar|ei\s*meghla|pather\s*klanti|runner/i.test(q)) {
      const hm = ALBUMS.find((a) => a.id === 'album-hemanta-classics');
      if (hm && !directMatches.some((m) => m.id === hm.id)) aliasMatches.push(hm);
    }
    if (/manna\s*dey|coffee\s*house|ami\s*jamini|lalita\s*go/i.test(q)) {
      const md = ALBUMS.find((a) => a.id === 'album-manna-dey');
      if (md && !directMatches.some((m) => m.id === md.id)) aliasMatches.push(md);
    }
    if (/chander\s*pahar|chander|shankar|kalahari/i.test(q)) {
      const cp = ALBUMS.find((a) => a.id === 'album-chander-pahar');
      if (cp && !directMatches.some((m) => m.id === cp.id)) aliasMatches.push(cp);
    }
    if (/paglu|karle\s*romance/i.test(q)) {
      const pag = ALBUMS.find((a) => a.id === 'album-paglu');
      if (pag && !directMatches.some((m) => m.id === pag.id)) aliasMatches.push(pag);
    }
    if (/challenge|bhangra\s*ta\s*sajda/i.test(q)) {
      const ch = ALBUMS.find((a) => a.id === 'album-challenge');
      if (ch && !directMatches.some((m) => m.id === ch.id)) aliasMatches.push(ch);
    }
    if (/jeet\s*gang|jeet\s*gannguli|jeet\s*ganguly/i.test(q)) {
      ALBUMS.forEach((a) => {
        if ((a.id === 'album-jeet-gannguli-hits' || a.id === 'album-paglu' || a.id === 'album-challenge' || a.artist.toLowerCase().includes('jeet')) && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/shreya.*bengali|bengali.*shreya|shreya.*bangla/i.test(q)) {
      const sgb = ALBUMS.find((a) => a.id === 'album-shreya-bengali');
      if (sgb && !directMatches.some((m) => m.id === sgb.id)) aliasMatches.push(sgb);
    }
    if (/prosenjit|bumbada|bumba\s*da/i.test(q)) {
      ALBUMS.forEach((a) => {
        if ((a.id === 'album-prosenjit-hits' || a.id === 'album-autograph' || a.id === 'album-praktan' || a.id === 'album-baishe-srabon' || a.artist.toLowerCase().includes('prosenjit')) && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/\bdev\b|deepak\s*adhikari|dev\s*hits/i.test(q)) {
      ALBUMS.forEach((a) => {
        if ((a.id === 'album-chander-pahar' || a.id === 'album-paglu' || a.id === 'album-challenge' || a.artist.toLowerCase().includes('dev')) && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }

    // Tamil Aliases
    if (/tamil|kollywood/i.test(q)) {
      ALBUMS.forEach((a) => {
        if (a.language === 'Tamil' && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/master|vaathi\s*coming|master\s*the\s*blaster|vaathi\s*raid/i.test(q)) {
      const mas = ALBUMS.find((a) => a.id === 'album-master');
      if (mas && !directMatches.some((m) => m.id === mas.id)) aliasMatches.push(mas);
    }
    if (/leo|naa\s*ready|badass|bloody\s*sweet|thalapathy/i.test(q)) {
      const leo = ALBUMS.find((a) => a.id === 'album-leo');
      if (leo && !directMatches.some((m) => m.id === leo.id)) aliasMatches.push(leo);
    }
    if (/jailer|hukum|kaavaalaa|rajinikanth|thalaivar/i.test(q)) {
      const jlr = ALBUMS.find((a) => a.id === 'album-jailer');
      if (jlr && !directMatches.some((m) => m.id === jlr.id)) aliasMatches.push(jlr);
    }
    if (/vikram|pathala\s*pathala|kamal\s*haasan|lcu/i.test(q)) {
      const vik = ALBUMS.find((a) => a.id === 'album-vikram');
      if (vik && !directMatches.some((m) => m.id === vik.id)) aliasMatches.push(vik);
    }
    if (/ponniyin|ps-?1|ps-?2|chola\s*chola/i.test(q)) {
      const ps = ALBUMS.find((a) => a.id === 'album-ponniyin-selvan');
      if (ps && !directMatches.some((m) => m.id === ps.id)) aliasMatches.push(ps);
    }

    // Telugu Aliases
    if (/telugu|tollywood/i.test(q)) {
      ALBUMS.forEach((a) => {
        if (a.language === 'Telugu' && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/ala\s*vaikunthapurramuloo|ala\s*vaikunta|buttabomma|samajavaragamana|ramuloo/i.test(q)) {
      const av = ALBUMS.find((a) => a.id === 'album-ala-vaikunthapurramuloo');
      if (av && !directMatches.some((m) => m.id === av.id)) aliasMatches.push(av);
    }
    if (/baahubali|bahubali|saahore|prabhas/i.test(q)) {
      const bb = ALBUMS.find((a) => a.id === 'album-baahubali-2');
      if (bb && !directMatches.some((m) => m.id === bb.id)) aliasMatches.push(bb);
    }
    if (/devara|fear\s*song|chuttamalle|daavudi|jr\s*ntr/i.test(q)) {
      const dev = ALBUMS.find((a) => a.id === 'album-devara');
      if (dev && !directMatches.some((m) => m.id === dev.id)) aliasMatches.push(dev);
    }
    if (/pushpa|srivalli|oo\s*antava|pushpa\s*pushpa|angaron|angaaron|sooseki/i.test(q)) {
      ALBUMS.forEach((a) => {
        if (a.id.includes('pushpa') && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/allu\s*arjun|icon\s*star/i.test(q)) {
      ALBUMS.forEach((a) => {
        if ((a.id.includes('pushpa') || a.id.includes('ala-vaikunthapurramuloo') || a.artist.toLowerCase().includes('allu arjun')) && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/jr\s*ntr|man\s*of\s*masses|tarak/i.test(q)) {
      ALBUMS.forEach((a) => {
        if ((a.id === 'album-rrr' || a.id === 'album-devara' || a.artist.toLowerCase().includes('jr ntr')) && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/sita\s*ramam|inthandham|dulquer/i.test(q)) {
      const sr = ALBUMS.find((a) => a.id === 'album-sita-ramam');
      if (sr && !directMatches.some((m) => m.id === sr.id)) aliasMatches.push(sr);
    }

    // South General / Pan-India
    if (/south|south\s*indian|south\s*movie|south\s*song/i.test(q)) {
      ALBUMS.forEach((a) => {
        if ((a.language === 'Tamil' || a.language === 'Telugu' || a.language === 'South') && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }

    // KGF & RRR
    if (/kgf|k\.g\.f|toofan|sulthan|rocky/i.test(q)) {
      ALBUMS.forEach((a) => {
        if (a.id.includes('kgf') && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }
    if (/rrr|naatu\s*naatu|komuram|ram\s*charan|keeravaani|ss\s*rajamouli/i.test(q)) {
      const rrr = ALBUMS.find((a) => a.id === 'album-rrr');
      if (rrr && !directMatches.some((m) => m.id === rrr.id)) aliasMatches.push(rrr);
    }

    // Bollywood blockbusters & classics
    if (/aashiqui|tum hi ho|sunn raha|chahun main/i.test(q)) {
      const ash = ALBUMS.find((a) => a.id.includes('aashiqui'));
      if (ash && !directMatches.some((m) => m.id === ash.id)) aliasMatches.push(ash);
    }
    if (/kishore|kumar|pal pal dil|roop tera|mere sapno/i.test(q)) {
      const kk = ALBUMS.find((a) => a.id === 'album-kishore-50');
      if (kk && !directMatches.some((m) => m.id === kk.id)) aliasMatches.push(kk);
    }
    if (/lata|mangeshkar|lag jaa gale|aap ki nazron|ajeeb dastan/i.test(q)) {
      const lm = ALBUMS.find((a) => a.id === 'album-lata-50');
      if (lm && !directMatches.some((m) => m.id === lm.id)) aliasMatches.push(lm);
    }
    if (/srk|shah rukh|shahrukh|king khan|badshah|gerua/i.test(q)) {
      const srk = ALBUMS.find((a) => a.id === 'album-srk-50');
      if (srk && !directMatches.some((m) => m.id === srk.id)) aliasMatches.push(srk);
    }
    if (/animal|jamal kudu|arjan vailly|pehle bhi main|satranga/i.test(q)) {
      const an = ALBUMS.find((a) => a.id === 'album-animal');
      if (an && !directMatches.some((m) => m.id === an.id)) aliasMatches.push(an);
    }
    if (/brahmastra|kesariya|deva deva|rasiya/i.test(q)) {
      const b = ALBUMS.find((a) => a.id === 'album-brahmastra');
      if (b && !directMatches.some((m) => m.id === b.id)) aliasMatches.push(b);
    }
    if (/ddlj|dilwale dulhania|tujhe dekha to/i.test(q)) {
      const ddlj = ALBUMS.find((a) => a.id === 'album-ddlj');
      if (ddlj && !directMatches.some((m) => m.id === ddlj.id)) aliasMatches.push(ddlj);
    }
    if (/jawan|chaleya|zinda banda/i.test(q)) {
      const jw = ALBUMS.find((a) => a.id === 'album-jawan');
      if (jw && !directMatches.some((m) => m.id === jw.id)) aliasMatches.push(jw);
    }
    if (/kabir\s*singh|bekhayali|kaise\s*hua/i.test(q)) {
      const ks = ALBUMS.find((a) => a.id === 'album-kabir-singh');
      if (ks && !directMatches.some((m) => m.id === ks.id)) aliasMatches.push(ks);
    }
    if (/rockstar|kun\s*faya\s*kun|nadaan\s*parinde/i.test(q)) {
      const rs = ALBUMS.find((a) => a.id === 'album-rockstar');
      if (rs && !directMatches.some((m) => m.id === rs.id)) aliasMatches.push(rs);
    }
    if (/shershaah|raataan lambiyan/i.test(q)) {
      const sh = ALBUMS.find((a) => a.id === 'album-shershaah');
      if (sh && !directMatches.some((m) => m.id === sh.id)) aliasMatches.push(sh);
    }
    if (/bhojpuri|bhojpuriya|pawan\s*singh|khesari|kamariya/i.test(q)) {
      ALBUMS.forEach((a) => {
        if (a.language === 'Bhojpuri' && !directMatches.some((m) => m.id === a.id)) {
          aliasMatches.push(a);
        }
      });
    }

    const combined = [...directMatches, ...aliasMatches];
    const seen = new Set<string>();
    let unique = combined.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

    // Prioritize relevant albums to the front based on specific search keywords
    if (unique.length > 1) {
      if (/mahalaya|mahishasuramardini|birendra|chandi/i.test(q)) {
        unique.sort((a, b) => (a.id === 'album-mahishasuramardini' ? -1 : b.id === 'album-mahishasuramardini' ? 1 : 0));
      } else if (/krishna|achyutam|radhe|govinda/i.test(q)) {
        unique.sort((a, b) => (a.id === 'album-krishna-bhajan' ? -1 : b.id === 'album-krishna-bhajan' ? 1 : 0));
      } else if (/film\s*album|movie\s*album|soundtrack|ost|cinema/i.test(q)) {
        unique.sort((a, b) => {
          const aIsSoundtrack = (a.genre || '').toLowerCase().includes('soundtrack') || (a.genre || '').toLowerCase().includes('cinema') || (a.genre || '').toLowerCase().includes('movie');
          const bIsSoundtrack = (b.genre || '').toLowerCase().includes('soundtrack') || (b.genre || '').toLowerCase().includes('cinema') || (b.genre || '').toLowerCase().includes('movie');
          if (aIsSoundtrack && !bIsSoundtrack) return -1;
          if (!aIsSoundtrack && bIsSoundtrack) return 1;
          return 0;
        });
      } else if (/bengali|bangla/i.test(q)) {
        unique.sort((a, b) => (a.language === 'Bengali' && b.language !== 'Bengali' ? -1 : b.language === 'Bengali' && a.language !== 'Bengali' ? 1 : 0));
      }
    }

    // 3. Fallback: If no direct catalog match exists, synthesize a smart Album item carrying songResults
    if (unique.length === 0 && songResults.length > 0) {
      const topTrack = songResults[0];
      const cleanTitle = searchQuery.replace(/\b(songs|song|all|music|video|audio|hits|soundtrack)\b/gi, '').trim();
      const albumTitle =
        cleanTitle.length > 2
          ? `${cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)} (Soundtrack)`
          : topTrack.album && !topTrack.album.toLowerCase().includes('single')
          ? topTrack.album
          : `${topTrack.title} - Album`;

      unique.push({
        id: `album-smart-${encodeURIComponent(searchQuery)}`,
        title: albumTitle,
        artist: topTrack.artist || 'Original Soundtrack',
        year: topTrack.releaseYear || 2024,
        coverUrl: topTrack.coverUrl,
        trackCount: songResults.length,
        accentColor: topTrack.accentColor || '#ff2d55',
        genre: topTrack.genre || 'Soundtrack & Movie Hits',
        tracks: songResults,
      });
    }

    return unique;
  }, []);

  // Load initial trending recommendations if queue is currently empty
  useEffect(() => {
    let isMounted = true;
    if (tracks.length === 0) {
      getTrendingMusic('IN').then((res) => {
        if (isMounted && res.length > 0) {
          setRecommendedTracks(res.slice(0, 6));
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [tracks.length]);

  // Primary Search Execution Function with memoization and catalog integration
  const performSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setSearchResults([]);
        setMatchingAlbums([]);
        setMatchingArtists([]);
        setIsLoading(false);
        return;
      }

      const cacheKey = trimmed.toLowerCase();
      // Check local memoization cache
      if (searchCacheRef.current.has(cacheKey)) {
        const cachedResults = searchCacheRef.current.get(cacheKey)!;
        setSearchResults(cachedResults);
        setMatchingAlbums(findAlbums(trimmed, cachedResults));
        setMatchingArtists(findArtists(trimmed));
        setIsLoading(false);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      setShowSuggestions(false);

      // 1. Gather catalog tracks immediately
      const catalogTracks = searchCatalogTracks(trimmed);
      if (catalogTracks.length > 0) {
        setSearchResults(catalogTracks);
        setMatchingAlbums(findAlbums(trimmed, catalogTracks));
        setMatchingArtists(findArtists(trimmed));
      }

      try {
        const results = await searchTracks(trimmed, 'IN');
        // Combine catalog tracks with online results without duplicate titles
        const combined = [...catalogTracks];
        const seenTitles = new Set(catalogTracks.map((t) => t.title.toLowerCase().trim()));
        results.forEach((r) => {
          const cleanTitle = r.title.toLowerCase().trim();
          if (!seenTitles.has(cleanTitle) && !combined.some((c) => c.id === r.id)) {
            seenTitles.add(cleanTitle);
            combined.push(r);
          }
        });

        searchCacheRef.current.set(cacheKey, combined);
        setSearchResults(combined);
        setMatchingAlbums(findAlbums(trimmed, combined));
        setMatchingArtists(findArtists(trimmed));
      } catch (err) {
        console.warn('Search execution warning:', err);
        if (catalogTracks.length > 0) {
          setSearchResults(catalogTracks);
          setMatchingAlbums(findAlbums(trimmed, catalogTracks));
          setMatchingArtists(findArtists(trimmed));
        } else {
          setSearchResults([]);
          setMatchingAlbums(findAlbums(trimmed, []));
          setMatchingArtists(findArtists(trimmed));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [findAlbums, findArtists, searchCatalogTracks]
  );

  // Strict debounce of 800ms on the search bar - do NOT fire an API call for every keystroke
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setMatchingAlbums([]);
      setMatchingArtists([]);
      setSearchTab('all');
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    // Instant cache retrieval if already searched (0 API requests)
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey)!;
      setSearchResults(cached);
      setMatchingAlbums(findAlbums(trimmed, cached));
      setMatchingArtists(findArtists(trimmed));
      setIsLoading(false);
      return;
    }

    // Strict 800ms debounce before executing YouTube search
    searchTimeoutRef.current = window.setTimeout(() => {
      performSearch(trimmed);
    }, 800);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Dynamic Auto-Suggest query completions (memoized + 600ms debounce)
  useEffect(() => {
    if (suggestTimeoutRef.current) {
      clearTimeout(suggestTimeoutRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (suggestCacheRef.current.has(cacheKey)) {
      setSuggestions(suggestCacheRef.current.get(cacheKey)!);
      setShowSuggestions(true);
      return;
    }

    suggestTimeoutRef.current = window.setTimeout(async () => {
      try {
        const fetched = await fetchSearchSuggestions(trimmed);
        if (fetched.length > 0) {
          suggestCacheRef.current.set(cacheKey, fetched);
          setSuggestions(fetched);
          setShowSuggestions(true);
        }
      } catch {}
    }, 600);

    return () => {
      if (suggestTimeoutRef.current) {
        clearTimeout(suggestTimeoutRef.current);
      }
    };
  }, [query]);

  // Handle explicit form submission (Enter key or Search icon click)
  const handleFormSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (suggestTimeoutRef.current) {
      clearTimeout(suggestTimeoutRef.current);
    }
    setShowSuggestions(false);
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  // Handle suggestion chip or autocomplete click
  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    setShowSuggestions(false);
    performSearch(term);
  };

  // Play search result:
  // When a user clicks a track from the Search Results, DO NOT copy the rest of the search results into the 'Up Next' queue.
  // Instead, set the clicked track as the active track, clear the existing queue, and immediately trigger
  // the dynamic recommendation algorithm to populate the 'Up Next' queue with related, diverse tracks based on the clicked song
  // (mimicking a true Music App radio mode).
  const handlePlaySearchResult = (track: Track) => {
    onPlayTrack(track, undefined, false, true);
  };

  const recognitionRef = useRef<any>(null);

  // Web Speech API Voice search handler
  const handleVoiceSearch = async () => {
    setIsVoiceListening(true);
    setVoiceFeedback('Listening... Speak a track name or artist');

    // Request microphone permission if mediaDevices is supported
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release stream since SpeechRecognition handles audio capture
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Microphone permission request error:', err);
      }
    }

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
        }

        const recognition = new SpeechRecognitionClass();
        recognitionRef.current = recognition;
        recognition.lang = navigator.language || 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setVoiceFeedback('Listening... Speak now (e.g. "Arijit Singh", "Kesariya")');
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          if (currentText) {
            setQuery(currentText);
            setVoiceFeedback(`Heard: "${currentText}"`);
          }

          if (finalTranscript) {
            const cleanFinal = finalTranscript.trim();
            setQuery(cleanFinal);
            setVoiceFeedback(`Searching for "${cleanFinal}"...`);
            setTimeout(() => {
              setIsVoiceListening(false);
              performSearch(cleanFinal);
            }, 600);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            setVoiceFeedback('Microphone permission denied. Tap a suggestion below:');
          } else {
            setVoiceFeedback('Could not detect speech. Tap a suggestion below:');
          }
        };

        recognition.onend = () => {
          // If query was captured, ensure search is executed
          if (query.trim()) {
            performSearch(query.trim());
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        setVoiceFeedback('Tap any suggestion below to search:');
      }
    } else {
      setVoiceFeedback('Voice recognition not supported. Tap any suggestion below:');
    }
  };

  const handleCloseVoiceModal = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsVoiceListening(false);
  };

  const handleVoicePromptSelect = (promptText: string) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setQuery(promptText);
    setIsVoiceListening(false);
    performSearch(promptText);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-3 pb-28 text-white min-h-[calc(100vh-140px)]">
      {/* Search Header Bar */}
      <div className="sticky top-16 z-20 pt-1 pb-3 bg-[#050505]/95 backdrop-blur-md">
        <form
          onSubmit={handleFormSubmit}
          className="relative flex items-center w-full h-12 rounded-2xl bg-white/10 hover:bg-white/[0.14] focus-within:bg-white/15 border border-white/15 focus-within:border-[#ff2d55] shadow-xl transition-all duration-300"
        >
          <button
            type="submit"
            aria-label="Search"
            className="pl-4 pr-1 text-zinc-400 hover:text-white transition-colors shrink-0 flex items-center justify-center focus:outline-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-[#ff2d55] shrink-0 animate-spin" />
            ) : (
              <Search className="w-5 h-5 shrink-0" />
            )}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search YouTube music, Hindi hits, Bengali songs, artists..."
            className="w-full bg-transparent pl-3 pr-10 text-sm text-white placeholder-zinc-400 focus:outline-none"
          />

          {/* Clear button */}
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchResults([]);
                setSuggestions([]);
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              className="p-1.5 mr-1 text-zinc-400 hover:text-white rounded-full bg-white/10 active:scale-95"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Voice Search Mic Button */}
          <button
            type="button"
            id="search-view-mic-btn"
            onClick={handleVoiceSearch}
            aria-label="Voice Search"
            className="p-2 mr-2 text-zinc-300 hover:text-[#ff2d55] hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <Mic className="w-4 h-4" />
          </button>
        </form>

        {/* Dynamic Autocomplete Suggestions Dropdown when typing */}
        {showSuggestions && suggestions.length > 0 && query.trim() && (
          <div className="mt-2 p-2 rounded-2xl bg-[#14141a]/95 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-1 animate-in fade-in duration-200">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 px-2 py-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#ff2d55]" />
              <span>Instant Suggestions</span>
            </div>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <span className="truncate font-medium">{suggestion}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#ff2d55] transition-colors shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Voice Search Listening Modal */}
      {isVoiceListening && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleCloseVoiceModal}
        >
          <div
            className="w-full max-w-sm bg-[#121218] rounded-3xl p-6 border border-white/15 shadow-2xl flex flex-col items-center text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#ff2d55]/20 border-2 border-[#ff2d55] flex items-center justify-center shadow-lg shadow-[#ff2d55]/40 animate-pulse">
                <Mic className="w-9 h-9 text-[#ff2d55]" />
              </div>
              <div className="absolute -inset-2 rounded-full border border-[#ff2d55]/30 animate-ping pointer-events-none" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Voice Search</h3>
              <p className="text-xs text-zinc-300 font-medium">{voiceFeedback}</p>
            </div>

            {/* Quick Voice Prompts */}
            <div className="w-full space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Tap to try a query:
              </span>
              {['Arijit Singh', 'Tum Hi Ho', 'Kesariya', 'Latest Bollywood songs'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleVoicePromptSelect(prompt)}
                  className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-200 text-left flex items-center justify-between transition-colors"
                >
                  <span>&quot;Play {prompt}&quot;</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#ff2d55]" />
                </button>
              ))}
            </div>

            <button
              onClick={handleCloseVoiceModal}
              className="text-xs font-bold text-zinc-400 hover:text-white pt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Body: If No Query, show Trending & Categories */}
      {!query.trim() ? (
        <div className="space-y-6 pt-2">
          {/* Trending Searches Chips */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff2d55] uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[#ff2d55]" />
              <span>Trending Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    performSearch(term);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-medium text-zinc-200 border border-white/10 transition-all flex items-center gap-1.5"
                >
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Browse Categories Bento Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#ff2d55]" />
              <span>Browse All Genres</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {GENRE_BROWSE_CARDS.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => {
                    setQuery(cat.query);
                    performSearch(cat.query);
                  }}
                  className={`p-3.5 rounded-2xl bg-gradient-to-br ${cat.color} bg-opacity-80 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 border border-white/10 flex items-center justify-between`}
                >
                  <span className="font-bold text-xs text-white drop-shadow-sm">{cat.name}</span>
                  <span className="text-xl">{cat.icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Quick Plays */}
          {(tracks.length > 0 || recommendedTracks.length > 0) && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Music2 className="w-4 h-4 text-[#ff2d55]" />
                  Top Songs You Might Like
                </span>
              </div>
              <div className="space-y-2">
                {(tracks.length > 0 ? tracks : recommendedTracks).slice(0, 6).map((track, idx) => (
                  <TrackCard
                    key={`${track.id}-${idx}`}
                    track={track}
                    variant="list-row"
                    index={idx}
                    isCurrentTrack={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    onPlay={() => onPlayTrack(track, tracks.length > 0 ? tracks : recommendedTracks)}
                    onToggleLike={onToggleLike}
                    onOpenMenu={onOpenMenu}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Search Results List with Smart Categorization (Songs & Albums) */
        <div className="space-y-4 pt-2">
          {/* Results Status & Clear Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#ff2d55] uppercase tracking-wider">
                {isLoading ? 'Searching...' : `Results for "${query}"`}
              </span>
              {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#ff2d55] animate-spin" />}
            </div>
            <button
              id="clear-search-btn"
              onClick={() => {
                setQuery('');
                setSearchResults([]);
                setMatchingAlbums([]);
                setSearchTab('all');
              }}
              className="text-xs text-zinc-400 hover:text-white font-medium cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Categorized Tabs / Filter Pills: All | Songs | Albums */}
          {!isLoading && (searchResults.length > 0 || matchingAlbums.length > 0) && (
            <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
              <button
                id="search-tab-all"
                onClick={() => setSearchTab('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  searchTab === 'all'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                All
              </button>

              <button
                id="search-tab-songs"
                onClick={() => setSearchTab('songs')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  searchTab === 'songs'
                    ? 'bg-[#ff2d55] text-white shadow-md shadow-[#ff2d55]/30'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <Music2 className="w-3.5 h-3.5" />
                <span>Songs ({searchResults.length})</span>
              </button>

              <button
                id="search-tab-albums"
                onClick={() => setSearchTab('albums')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  searchTab === 'albums'
                    ? 'bg-[#ff2d55] text-white shadow-md shadow-[#ff2d55]/30'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Albums ({matchingAlbums.length})</span>
              </button>

              {matchingArtists.length > 0 && (
                <button
                  id="search-tab-artists"
                  onClick={() => setSearchTab('artists')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    searchTab === 'artists'
                      ? 'bg-[#ff2d55] text-white shadow-md shadow-[#ff2d55]/30'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Artists ({matchingArtists.length})</span>
                </button>
              )}
            </div>
          )}

          {/* 1. ALL TAB */}
          {searchTab === 'all' && (
            <div className="space-y-4">
              {/* Categorized Artists Shelf (if any matching artists) */}
              {matchingArtists.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#ff2d55]" />
                      <span>Artists & Actors ({matchingArtists.length})</span>
                    </span>
                    <button
                      onClick={() => setSearchTab('artists')}
                      className="text-[11px] text-[#ff2d55] hover:text-white font-bold transition-colors cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {matchingArtists.map((artist) => (
                      <div
                        key={artist.id}
                        id={`search-artist-card-${artist.id}`}
                        onClick={() => onSelectArtist?.(artist)}
                        className="group flex-shrink-0 w-32 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#ff2d55]/40 cursor-pointer transition-all text-center flex flex-col items-center shadow-md"
                      >
                        <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2 ring-2 ring-white/10 group-hover:ring-[#ff2d55] transition-all bg-black/40 shadow-inner">
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, 'artist')}
                          />
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate w-full">
                          {artist.name}
                        </h4>
                        <span className="text-[10px] text-zinc-400 mt-0.5">
                          {artist.isActor ? 'Actor' : artist.role || 'Artist'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized Albums Shelf (if any matching albums) */}
              {matchingAlbums.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Disc className="w-3.5 h-3.5 text-[#ff2d55]" />
                      <span>Albums & Soundtracks ({matchingAlbums.length})</span>
                    </span>
                    <button
                      onClick={() => setSearchTab('albums')}
                      className="text-[11px] text-[#ff2d55] hover:text-white font-bold transition-colors cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {matchingAlbums.map((album) => (
                      <div
                        key={album.id}
                        id={`search-album-card-${album.id}`}
                        onClick={() => onSelectAlbum?.(album)}
                        className="group flex-shrink-0 w-36 p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 cursor-pointer transition-all shadow-md"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-black/40">
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, 'album')}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#ff2d55] flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                            </div>
                          </div>
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-0.5">
                            <Music2 className="w-2.5 h-2.5 text-[#ff2d55]" />
                            <span>{album.trackCount}</span>
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate">
                          {album.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {album.artist} • {album.year}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized Songs List */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-[#ff2d55]" />
                      <span>Songs ({searchResults.length})</span>
                    </span>
                  </div>
                  {searchResults.map((track, idx) => (
                    <TrackCard
                      key={`${track.id}-${idx}`}
                      track={track}
                      variant="list-row"
                      index={idx}
                      isCurrentTrack={currentTrack?.id === track.id}
                      isPlaying={isPlaying}
                      onPlay={() => handlePlaySearchResult(track)}
                      onToggleLike={onToggleLike}
                      onOpenMenu={onOpenMenu}
                    />
                  ))}
                </div>
              )}

              {searchResults.length === 0 && matchingAlbums.length === 0 && !isLoading && (
                <div className="py-16 text-center text-zinc-400 text-xs bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                  <p className="font-semibold text-white">No results found matching &quot;{query}&quot;</p>
                  <p className="text-zinc-500">Try searching for &quot;KGF 2&quot;, &quot;Brahmastra&quot;, &quot;Animal&quot;, or &quot;Arijit Singh&quot;</p>
                </div>
              )}
            </div>
          )}

          {/* 2. SONGS TAB */}
          {searchTab === 'songs' && (
            <div className="space-y-2">
              {searchResults.length > 0 ? (
                searchResults.map((track, idx) => (
                  <TrackCard
                    key={`${track.id}-${idx}`}
                    track={track}
                    variant="list-row"
                    index={idx}
                    isCurrentTrack={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    onPlay={() => handlePlaySearchResult(track)}
                    onToggleLike={onToggleLike}
                    onOpenMenu={onOpenMenu}
                  />
                ))
              ) : !isLoading ? (
                <div className="py-16 text-center text-zinc-400 text-xs bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                  <p className="font-semibold text-white">No individual songs found matching &quot;{query}&quot;</p>
                  <p className="text-zinc-500">Check the Albums tab to explore full soundtracks.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* 3. ALBUMS TAB */}
          {searchTab === 'albums' && (
            <div className="space-y-4">
              {matchingAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {matchingAlbums.map((album) => (
                    <div
                      key={album.id}
                      id={`search-album-grid-${album.id}`}
                      onClick={() => onSelectAlbum?.(album)}
                      className="group p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#ff2d55]/40 cursor-pointer transition-all shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-black/40 shadow-md">
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, 'album')}
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#ff2d55] flex items-center justify-center shadow-xl">
                              <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                            <Music2 className="w-3 h-3 text-[#ff2d55]" />
                            <span>{album.trackCount} tracks</span>
                          </div>
                          {album.language && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#ff2d55]/80 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-wider">
                              {album.language}
                            </div>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate">
                          {album.title}
                        </h4>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {album.artist}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {album.year} • {album.genre || 'Soundtrack'}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlbum?.(album);
                        }}
                        className="w-full mt-3 py-1.5 px-3 rounded-xl bg-white/5 group-hover:bg-[#ff2d55] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10 group-hover:border-transparent"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Listen to Full Album</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : !isLoading ? (
                <div className="py-16 text-center text-zinc-400 text-xs bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                  <p className="font-semibold text-white">No dedicated album entry found for &quot;{query}&quot;</p>
                  {searchResults.length > 0 && (
                    <>
                      <p className="text-zinc-500">
                        We found {searchResults.length} songs. Would you like to create and listen to an album playlist for &quot;{query}&quot;?
                      </p>
                      <button
                        onClick={() => {
                          const smartAlbum: Album = {
                            id: `album-smart-${encodeURIComponent(query)}`,
                            title: `${query.charAt(0).toUpperCase() + query.slice(1)} (Soundtrack)`,
                            artist: searchResults[0]?.artist || 'Various Artists',
                            year: 2023,
                            coverUrl: searchResults[0]?.coverUrl || '',
                            trackCount: searchResults.length,
                            accentColor: '#ff2d55',
                            genre: 'Soundtrack & Hits',
                          };
                          onSelectAlbum?.(smartAlbum);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#ff2d55] text-white text-xs font-bold shadow-lg"
                      >
                        Listen to &quot;{query}&quot; as an Album
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* 4. ARTISTS TAB */}
          {searchTab === 'artists' && (
            <div className="space-y-4">
              {matchingArtists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {matchingArtists.map((artist) => (
                    <div
                      key={artist.id}
                      id={`search-artist-grid-${artist.id}`}
                      onClick={() => onSelectArtist?.(artist)}
                      className="group p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#ff2d55]/40 cursor-pointer transition-all shadow-lg flex flex-col items-center text-center justify-between"
                    >
                      <div className="flex flex-col items-center w-full">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3 ring-2 ring-white/10 group-hover:ring-[#ff2d55] transition-all bg-black/40 shadow-md">
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, 'artist')}
                          />
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate w-full">
                          {artist.name}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate w-full">
                          {artist.isActor ? 'Actor & Icon' : artist.role || 'Singer / Composer'}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          {artist.monthlyListeners} listeners
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectArtist?.(artist);
                        }}
                        className="w-full mt-3 py-1.5 px-3 rounded-xl bg-white/5 group-hover:bg-[#ff2d55] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10 group-hover:border-transparent cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                        <span>View Discography</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : !isLoading ? (
                <div className="py-16 text-center text-zinc-400 text-xs bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                  <p className="font-semibold text-white">No specific artist found for &quot;{query}&quot;</p>
                  <p className="text-zinc-500">Check the Songs or Albums tab to stream tracks.</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
