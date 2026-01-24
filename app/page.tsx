'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadFiles } from './lib/uploadthing';

// Photo interface
interface Photo {
  _id?: string;
  key: string;
  url: string;
  filename: string;
  size: number;
  uploaded_at: string;
}

// API functions for photos
async function loadPhotos(): Promise<Photo[]> {
  try {
    const response = await fetch('/api/photos');
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error loading photos:', error);
    return [];
  }
}

async function savePhotoMetadata(
  key: string, 
  url: string, 
  filename: string, 
  size: number,
  adminPassword: string
): Promise<Photo | null> {
  try {
    const response = await fetch('/api/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword,
      },
      body: JSON.stringify({ key, url, filename, size }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Falsches Passwort');
      }
      return null;
    }
    const data = await response.json();
    return data.photo;
  } catch (error) {
    console.error('Error saving photo:', error);
    throw error;
  }
}

async function deletePhoto(key: string, adminPassword: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/photos?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': adminPassword,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
}

// API functions for orders
async function saveOrder(guestName: string, mainCourse: string, drink: string): Promise<boolean> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_name: guestName, main_course: mainCourse, drink: drink }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving order:', error);
    return false;
  }
}

async function loadOrder(guestName: string): Promise<{ main_course: string; drink: string } | null> {
  try {
    const response = await fetch(`/api/orders?guest_name=${encodeURIComponent(guestName)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading order:', error);
    return null;
  }
}

interface Order {
  guest_name: string;
  main_course: string | null;
  drink: string | null;
  updated_at?: string;
}

async function loadAllOrders(): Promise<Order[]> {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error loading all orders:', error);
    return [];
  }
}

// Countdown calculation
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeLeft = (): TimeLeft => {
  const weddingDate = new Date('2026-06-13T14:00:00');
  const now = new Date();
  const difference = weddingDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

// Schedule data
const scheduleItems = [
  { time: '14:00', event: 'Eintreffen der Gäste vor der Orangerie', emoji: '👋', isBreak: false },
  { time: '14:30', event: 'Standesamtliche Trauung im Lesesaal der Orangerie', emoji: '💍', isBreak: false },
  { time: '15:00', event: 'Auszug aus dem Standesamt mit Gästen und Seifenblasen', emoji: '🫧', isBreak: false },
  { time: '15:10', event: 'Beginn Fotoshooting aller Gäste', emoji: '📸', isBreak: false },
  { time: '16:15', event: 'Fotoshooting Brautpaar', emoji: '💕', isBreak: false },
  { time: '', event: 'Ab hier haben unsere Gäste ein wenig Zeit für sich', emoji: '⏰', isBreak: true },
  { time: '17:20', event: 'Treffpunkt aller Gäste beim La strada in Kempten', emoji: '📍', isBreak: false },
  { time: '17:30', event: 'Brautpaar kommt zum Restaurant - Abendessen beginnt', emoji: '🍽️', isBreak: false },
];

// Location data
const locations = [
  {
    name: 'Standesamt Orangerie Kempten',
    subtitle: 'Trauung',
    address: 'Lesesaal, Orangerieweg 20-22',
    city: '87439 Kempten (Allgäu)',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Orangerie+Kempten+Orangerieweg+20+87439+Kempten',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2679.8!2d10.3156!3d47.7267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479c39f8a8b8b8b9%3A0x0!2sOrangerieweg%2020-22%2C%2087439%20Kempten!5e0!3m2!1sde!2sde!4v1',
  },
  {
    name: 'La strada Kempten',
    subtitle: 'Feier & Abendessen',
    address: 'Kronenstraße 18',
    city: '87435 Kempten (Allgäu)',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=La+strada+Kempten+Kronenstraße+18+87435+Kempten',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2679.8!2d10.3156!3d47.7267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479c39f8a8b8b8b9%3A0x0!2sKronenstra%C3%9Fe%2018%2C%2087435%20Kempten!5e0!3m2!1sde!2sde!4v1',
  },
];

// Guest list data
const guestList = [
  { name: 'Fatih Karaoglu', family: 'Karaoglu' },
  { name: 'Lilly Ehmling', family: 'Ehmling' },
  { name: 'Aysun Karaoglu', family: 'Karaoglu' },
  { name: 'Ayhan Karaoglu', family: 'Karaoglu' },
  { name: 'Furkan Karaoglu', family: 'Karaoglu' },
  { name: 'Madeleine Ehmling', family: 'Ehmling' },
  { name: 'Jörn Ehmling', family: 'Ehmling' },
  { name: 'Jira Ehmling', family: 'Ehmling' },
  { name: 'Jonas Ehmling', family: 'Ehmling' },
  { name: 'Valentin Ehmling', family: 'Ehmling' },
  { name: 'Johanna Wetzel', family: 'Wetzel' },
  { name: 'Marianna Wetzel', family: 'Wetzel' },
  { name: 'Fabian Schneider', family: 'Schneider' },
  { name: 'Emin Kasan', family: 'Kasan' },
  { name: 'Nurcan Kasan', family: 'Kasan' },
  { name: 'Aleyna Kasan', family: 'Kasan' },
];

// Seating arrangement data
const seatingArrangement = {
  bride: 'Lilly Ehmling',
  groom: 'Fatih Karaoglu',
  bridesSide: [
    'Valentin Ehmling',
    'Madeleine Ehmling',
    'Jonas Ehmling',
    'Jörn Ehmling',
    'Jira Ehmling',
    'Johanna Wetzel',
    'Marianna Wetzel',
  ],
  groomsSide: [
    'Aysun Karaoglu',
    'Ayhan Karaoglu',
    'Furkan Karaoglu',
    'Aleyna Kasan',
    'Nurcan Kasan',
    'Emin Kasan',
    'Fabian Schneider',
  ],
};

// Main courses (placeholder)
const mainCourses = [
  { id: 'rinderfilet', name: 'Rinderfilet mit Rotwein-Jus', description: 'Zartes Rinderfilet mit hausgemachter Rotwein-Jus, dazu Kartoffelgratin und Gemüse der Saison' },
  { id: 'haehnchen', name: 'Hähnchenbrust mit Kräuterkruste', description: 'Saftiges Hähnchenbrustfilet mit mediterraner Kräuterkruste, Rosmarinkartoffeln und buntem Gemüse' },
  { id: 'vegetarisch', name: 'Vegetarische Pasta mit Trüffelrahm', description: 'Hausgemachte Pasta in cremiger Trüffelrahmsauce mit frischen Pilzen und Parmesan' },
  { id: 'lachs', name: 'Lachsfilet auf Blattspinat', description: 'Gebratenes Lachsfilet auf frischem Blattspinat mit Zitronenbutter und Dillkartoffeln' },
];

// Drinks (placeholder)
const drinks = [
  { id: 'wasser-still', name: 'Wasser (still)', category: 'Alkoholfrei' },
  { id: 'wasser-sprudel', name: 'Wasser (sprudelnd)', category: 'Alkoholfrei' },
  { id: 'cola', name: 'Cola', category: 'Softdrinks' },
  { id: 'fanta', name: 'Fanta', category: 'Softdrinks' },
  { id: 'sprite', name: 'Sprite', category: 'Softdrinks' },
  { id: 'bier', name: 'Bier', category: 'Alkoholisch' },
  { id: 'weisswein', name: 'Weißwein', category: 'Alkoholisch' },
  { id: 'rotwein', name: 'Rotwein', category: 'Alkoholisch' },
  { id: 'sekt', name: 'Sekt', category: 'Alkoholisch' },
  { id: 'alkoholfrei-bier', name: 'Alkoholfreies Bier', category: 'Alkoholfrei' },
];

// Animation keyframes embedded for reliability
const animationStyles = `
  :root {
    --petal-duration-multiplier: 0.5;
  }
  @media (min-width: 640px) {
    :root { --petal-duration-multiplier: 0.7; }
  }
  @media (min-width: 768px) {
    :root { --petal-duration-multiplier: 0.85; }
  }
  @media (min-width: 1024px) {
    :root { --petal-duration-multiplier: 1; }
  }

  /* Top-right cone spread: Path 1 = more horizontal, Path 2 = diagonal, Path 3 = more vertical */
  @keyframes floatFromTopRight1 {
    0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
    5% { opacity: 0.9; }
    20% { transform: translate(-12vw, 4vh) rotate(25deg) scale(0.97); }
    40% { transform: translate(-28vw, 10vh) rotate(70deg) scale(0.93); }
    60% { transform: translate(-40vw, 18vh) rotate(140deg) scale(0.88); }
    80% { transform: translate(-48vw, 26vh) rotate(220deg) scale(0.83); }
    95% { opacity: 0.7; }
    100% { transform: translate(-55vw, 32vh) rotate(300deg) scale(0.8); opacity: 0; }
  }
  @keyframes floatFromTopRight2 {
    0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
    5% { opacity: 0.9; }
    20% { transform: translate(-8vw, 8vh) rotate(45deg) scale(0.97); }
    40% { transform: translate(-20vw, 20vh) rotate(110deg) scale(0.93); }
    60% { transform: translate(-30vw, 32vh) rotate(190deg) scale(0.88); }
    80% { transform: translate(-38vw, 42vh) rotate(280deg) scale(0.83); }
    95% { opacity: 0.65; }
    100% { transform: translate(-45vw, 50vh) rotate(360deg) scale(0.78); opacity: 0; }
  }
  @keyframes floatFromTopRight3 {
    0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
    5% { opacity: 0.85; }
    20% { transform: translate(-4vw, 12vh) rotate(60deg) scale(0.96); }
    40% { transform: translate(-10vw, 28vh) rotate(130deg) scale(0.91); }
    60% { transform: translate(-18vw, 42vh) rotate(210deg) scale(0.86); }
    80% { transform: translate(-24vw, 54vh) rotate(290deg) scale(0.81); }
    95% { opacity: 0.6; }
    100% { transform: translate(-30vw, 65vh) rotate(380deg) scale(0.75); opacity: 0; }
  }
  /* Bottom-left cone spread: Path 1 = more horizontal, Path 2 = diagonal, Path 3 = more vertical */
  @keyframes floatFromBottomLeft1 {
    0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
    5% { opacity: 0.9; }
    20% { transform: translate(12vw, -4vh) rotate(-25deg) scale(0.97); }
    40% { transform: translate(28vw, -10vh) rotate(-70deg) scale(0.93); }
    60% { transform: translate(40vw, -18vh) rotate(-140deg) scale(0.88); }
    80% { transform: translate(48vw, -26vh) rotate(-220deg) scale(0.83); }
    95% { opacity: 0.7; }
    100% { transform: translate(55vw, -32vh) rotate(-300deg) scale(0.8); opacity: 0; }
  }
  @keyframes floatFromBottomLeft2 {
    0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
    5% { opacity: 0.9; }
    20% { transform: translate(8vw, -8vh) rotate(-45deg) scale(0.97); }
    40% { transform: translate(20vw, -20vh) rotate(-110deg) scale(0.93); }
    60% { transform: translate(30vw, -32vh) rotate(-190deg) scale(0.88); }
    80% { transform: translate(38vw, -42vh) rotate(-280deg) scale(0.83); }
    95% { opacity: 0.65; }
    100% { transform: translate(45vw, -50vh) rotate(-360deg) scale(0.78); opacity: 0; }
  }
  @keyframes floatFromBottomLeft3 {
    0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
    5% { opacity: 0.85; }
    20% { transform: translate(4vw, -12vh) rotate(-60deg) scale(0.96); }
    40% { transform: translate(10vw, -28vh) rotate(-130deg) scale(0.91); }
    60% { transform: translate(18vw, -42vh) rotate(-210deg) scale(0.86); }
    80% { transform: translate(24vw, -54vh) rotate(-290deg) scale(0.81); }
    95% { opacity: 0.6; }
    100% { transform: translate(30vw, -65vh) rotate(-380deg) scale(0.75); opacity: 0; }
  }
  @keyframes roseSwayRight {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(1.5deg); }
  }
  @keyframes roseSwayLeft {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-1.5deg); }
  }

  /* Petal animation classes with responsive durations - slower on mobile for gentle effect */
  .petal-1 { animation: floatFromTopRight1 16s ease-in-out infinite; }
  .petal-2 { animation: floatFromTopRight2 18s ease-in-out infinite; }
  .petal-3 { animation: floatFromTopRight3 15s ease-in-out infinite; }
  .petal-4 { animation: floatFromTopRight1 17s ease-in-out infinite; }
  .petal-5 { animation: floatFromTopRight2 19s ease-in-out infinite; }
  .petal-6 { animation: floatFromTopRight3 16s ease-in-out infinite; }
  .petal-7 { animation: floatFromBottomLeft1 17s ease-in-out infinite; }
  .petal-8 { animation: floatFromBottomLeft2 15s ease-in-out infinite; }
  .petal-9 { animation: floatFromBottomLeft3 18s ease-in-out infinite; }
  .petal-10 { animation: floatFromBottomLeft1 16s ease-in-out infinite; }
  .petal-11 { animation: floatFromBottomLeft2 19s ease-in-out infinite; }
  .petal-12 { animation: floatFromBottomLeft3 17s ease-in-out infinite; }

  @media (min-width: 640px) {
    .petal-1 { animation-duration: 14s; }
    .petal-2 { animation-duration: 16s; }
    .petal-3 { animation-duration: 13s; }
    .petal-4 { animation-duration: 15s; }
    .petal-5 { animation-duration: 17s; }
    .petal-6 { animation-duration: 14s; }
    .petal-7 { animation-duration: 15s; }
    .petal-8 { animation-duration: 13s; }
    .petal-9 { animation-duration: 16s; }
    .petal-10 { animation-duration: 14s; }
    .petal-11 { animation-duration: 17s; }
    .petal-12 { animation-duration: 15s; }
  }

  @media (min-width: 768px) {
    .petal-1 { animation-duration: 12s; }
    .petal-2 { animation-duration: 14s; }
    .petal-3 { animation-duration: 11s; }
    .petal-4 { animation-duration: 13s; }
    .petal-5 { animation-duration: 15s; }
    .petal-6 { animation-duration: 12s; }
    .petal-7 { animation-duration: 13s; }
    .petal-8 { animation-duration: 11s; }
    .petal-9 { animation-duration: 14s; }
    .petal-10 { animation-duration: 12s; }
    .petal-11 { animation-duration: 15s; }
    .petal-12 { animation-duration: 13s; }
  }

  @media (min-width: 1024px) {
    .petal-1 { animation-duration: 12s; }
    .petal-2 { animation-duration: 14s; }
    .petal-3 { animation-duration: 11s; }
    .petal-4 { animation-duration: 13s; }
    .petal-5 { animation-duration: 15s; }
    .petal-6 { animation-duration: 12s; }
    .petal-7 { animation-duration: 13s; }
    .petal-8 { animation-duration: 11s; }
    .petal-9 { animation-duration: 14s; }
    .petal-10 { animation-duration: 12s; }
    .petal-11 { animation-duration: 15s; }
    .petal-12 { animation-duration: 13s; }
  }
`;

// Petal configuration for realistic floating animation with path variations
const petalConfigs = [
  // Top-right corner petals (float toward center-left) - varied paths 1, 2, 3
  { id: 1, src: '/Petal1.png', corner: 'tr', path: 1, delay: '0s', duration: '12s', top: '8%', right: '5%', size: 45 },
  { id: 2, src: '/Petal2.png', corner: 'tr', path: 2, delay: '2.5s', duration: '14s', top: '12%', right: '10%', size: 35 },
  { id: 3, src: '/Petal3.png', corner: 'tr', path: 3, delay: '5s', duration: '11s', top: '5%', right: '15%', size: 40 },
  { id: 4, src: '/Petal4.png', corner: 'tr', path: 1, delay: '7.5s', duration: '13s', top: '15%', right: '3%', size: 38 },
  { id: 5, src: '/Petal1.png', corner: 'tr', path: 2, delay: '10s', duration: '15s', top: '3%', right: '8%', size: 32 },
  { id: 6, src: '/Petal3.png', corner: 'tr', path: 3, delay: '4s', duration: '12s', top: '18%', right: '12%', size: 42 },
  // Bottom-left corner petals (float toward center-right) - varied paths 1, 2, 3
  { id: 7, src: '/Petal2.png', corner: 'bl', path: 1, delay: '1s', duration: '13s', bottom: '8%', left: '5%', size: 40 },
  { id: 8, src: '/Petal4.png', corner: 'bl', path: 2, delay: '3.5s', duration: '11s', bottom: '12%', left: '10%', size: 36 },
  { id: 9, src: '/Petal1.png', corner: 'bl', path: 3, delay: '6s', duration: '14s', bottom: '5%', left: '15%', size: 44 },
  { id: 10, src: '/Petal3.png', corner: 'bl', path: 1, delay: '8.5s', duration: '12s', bottom: '15%', left: '3%', size: 38 },
  { id: 11, src: '/Petal2.png', corner: 'bl', path: 2, delay: '11s', duration: '15s', bottom: '3%', left: '8%', size: 34 },
  { id: 12, src: '/Petal4.png', corner: 'bl', path: 3, delay: '2s', duration: '13s', bottom: '18%', left: '12%', size: 41 },
];

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Page fade-in state
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Menu selection state
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showGuestListModal, setShowGuestListModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'guest' | 'main' | 'drink' | 'confirm' | 'success'>('guest');
  const [selectedGuest, setSelectedGuest] = useState<string>('');
  const [selectedMainCourse, setSelectedMainCourse] = useState<string>('');
  const [selectedDrink, setSelectedDrink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingOrder, setExistingOrder] = useState<{ main_course: string; drink: string } | null>(null);

  // Photo gallery state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [showAdminUploadModal, setShowAdminUploadModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos on mount
  useEffect(() => {
    loadPhotos().then(setPhotos);
  }, []);

  // Handle admin authentication
  const handleAdminAuth = () => {
    if (adminPassword) {
      setIsAdminAuthenticated(true);
    }
  };

  // Handle file selection for upload using Uploadthing
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !adminPassword) return;
    
    // First verify admin password
    try {
      const verifyResponse = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ verify: true }),
      });
      
      if (verifyResponse.status === 401) {
        alert('Falsches Admin-Passwort!');
        setIsAdminAuthenticated(false);
        setAdminPassword('');
        return;
      }
    } catch {
      // Continue with upload
    }
    
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (fileArray.length === 0) return;
    
    setUploadProgress({ current: 0, total: fileArray.length });
    
    try {
      // Upload all files at once using uploadthing client
      const uploadResult = await uploadFiles('photoUploader', {
        files: fileArray,
      });
      
      // Save each uploaded file to our database
      for (let i = 0; i < uploadResult.length; i++) {
        const uploaded = uploadResult[i];
        
        if (uploaded.serverData) {
          const photo = await savePhotoMetadata(
            uploaded.serverData.key,
            uploaded.serverData.url,
            uploaded.serverData.name,
            uploaded.serverData.size,
            adminPassword
          );
          
          if (photo) {
            setPhotos(prev => [photo, ...prev]);
          }
        }
        
        setUploadProgress({ current: i + 1, total: uploadResult.length });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Fehler beim Hochladen. Bitte versuche es erneut.');
    }
    
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle photo deletion
  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('Möchtest du dieses Foto wirklich löschen?')) return;
    
    const success = await deletePhoto(photo.key, adminPassword);
    if (success) {
      setPhotos(prev => prev.filter(p => p.key !== photo.key));
      if (lightboxPhoto?.key === photo.key) {
        setLightboxPhoto(null);
      }
    } else {
      alert('Fehler beim Löschen des Fotos.');
    }
  };

  // Handle photo download
  const handleDownloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(photo.url, '_blank');
    }
  };

  // Load saved guest from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGuest = localStorage.getItem('wedding-selected-guest');
      if (savedGuest) {
        setSelectedGuest(savedGuest);
      }
    }
  }, []);

  // Load existing order when guest changes
  const loadExistingOrder = useCallback(async (guestName: string) => {
    if (!guestName) return;
    setIsLoading(true);
    try {
      const order = await loadOrder(guestName);
      if (order) {
        setExistingOrder(order);
        setSelectedMainCourse(order.main_course || '');
        setSelectedDrink(order.drink || '');
      } else {
        setExistingOrder(null);
        setSelectedMainCourse('');
        setSelectedDrink('');
      }
    } catch (error) {
      console.error('Error loading order:', error);
    }
    setIsLoading(false);
  }, []);

  // Handle guest selection
  const handleGuestSelect = async (guestName: string) => {
    setSelectedGuest(guestName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wedding-selected-guest', guestName);
    }
    await loadExistingOrder(guestName);
    setCurrentStep('main');
  };

  // Handle switching guest
  const handleSwitchGuest = () => {
    setCurrentStep('guest');
    setSelectedMainCourse('');
    setSelectedDrink('');
    setExistingOrder(null);
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!selectedGuest || !selectedMainCourse || !selectedDrink) return;
    
    setIsLoading(true);
    try {
      const success = await saveOrder(selectedGuest, selectedMainCourse, selectedDrink);
      if (success) {
        setCurrentStep('success');
      } else {
        alert('Es gab einen Fehler beim Speichern. Bitte versuche es erneut.');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Es gab einen Fehler beim Speichern. Bitte versuche es erneut.');
    }
    setIsLoading(false);
  };

  // Open menu modal
  const openMenuModal = async () => {
    setShowMenuModal(true);
    if (selectedGuest) {
      await loadExistingOrder(selectedGuest);
      setCurrentStep('main');
    } else {
      setCurrentStep('guest');
    }
  };

  // Close menu modal
  const closeMenuModal = () => {
    setShowMenuModal(false);
    setCurrentStep(selectedGuest ? 'main' : 'guest');
  };

  // Export orders as CSV
  const exportOrdersAsCSV = async () => {
    setIsLoading(true);
    try {
      const orders = await loadAllOrders();
      if (orders.length === 0) {
        alert('Keine Bestellungen vorhanden.');
        setIsLoading(false);
        return;
      }

      // Create CSV content
      const headers = ['Name', 'Hauptspeise', 'Getränk', 'Bestellt am'];
      const rows = orders.map(order => [
        order.guest_name,
        order.main_course || '-',
        order.drink || '-',
        order.updated_at ? new Date(order.updated_at).toLocaleDateString('de-DE') : '-'
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      // Download CSV
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `hochzeit-bestellungen-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Fehler beim Exportieren der Bestellungen.');
    }
    setIsLoading(false);
  };

  // Audio control functions
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.log('Audio playback failed:', error);
        });
      }
    }
  };

  // Auto-play music on mount and set volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Set volume to 30%
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.log('Audio autoplay blocked:', error);
      });
    }
    // Trigger page fade-in
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Countdown effect
  useEffect(() => {
    setIsClient(true);
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Countdown', href: '#countdown' },
    { name: 'Adressen', href: '#locations' },
    { name: 'Tagesablauf', href: '#schedule' },
    { name: 'Infos', href: '#info' },
    { name: 'Sitzordnung', href: '#seating' },
    { name: 'Galerie', href: '#gallery' },
    { name: 'Menüauswahl', href: '#menu', onClick: () => openMenuModal() },
    { name: 'Gästeliste', href: '#guests', onClick: () => setShowGuestListModal(true) },
  ];

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#fdfbfa' }}>
      {/* Page Fade-in Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[200] bg-white transition-opacity duration-1500 ease-out"
        style={{ opacity: isPageLoaded ? 0 : 1 }}
      />

      {/* Background Music */}
      <audio
        ref={audioRef}
        src="/song.mpeg"
        loop
        preload="auto"
      />

      {/* Animation Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      {/* Navigation */}
      <nav className="relative z-20 w-full px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.onClick ? undefined : link.href}
                onClick={(e) => {
                  if (link.onClick) {
                    e.preventDefault();
                    link.onClick();
                  }
                }}
                className="font-cormorant cursor-pointer text-sm tracking-wide transition-colors hover:text-[#c08b8b]"
                style={{ color: '#6b6b6b' }}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Music Toggle Button */}
          <button
            onClick={toggleMusic}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all hover:bg-[#f5e6e0]"
            style={{ border: '1px solid #e8c5c5' }}
            title={isPlaying ? 'Musik pausieren' : 'Musik abspielen'}
          >
            {isPlaying ? (
              <svg className="h-4 w-4" fill="#d4a5a5" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="#d4a5a5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
            <span className="font-cormorant text-xs hidden sm:inline" style={{ color: '#6b6b6b' }}>
              {isPlaying ? 'Pause' : 'Musik'}
            </span>
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="#6b6b6b"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute left-0 top-full w-full bg-[#fdfbfa] px-6 py-4 shadow-lg md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.onClick ? undefined : link.href}
                  className="font-cormorant cursor-pointer text-sm tracking-wide transition-colors hover:text-[#c08b8b]"
                  style={{ color: '#6b6b6b' }}
                  onClick={(e) => {
                    if (link.onClick) {
                      e.preventDefault();
                      link.onClick();
                    }
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex min-h-[calc(100vh-100px)] flex-col items-center justify-center px-6">
        <div className="text-center">
          {/* Names */}
          <h1 className="font-playfair text-5xl tracking-wide sm:text-6xl md:text-7xl lg:text-8xl">
            <span style={{ color: '#d4a5a5' }}>LILLY</span>
            <span
              className="font-great-vibes mx-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ color: '#c9b1a0' }}
            >
              &
            </span>
            <span style={{ color: '#d4a5a5' }}>FATIH</span>
          </h1>

          {/* Subtitle */}
          <p
            className="font-cormorant mt-6 text-sm tracking-[0.3em] sm:text-base md:text-lg"
            style={{ color: '#8b8b8b' }}
          >
            Für die Ewigkeit
          </p>

          {/* Wedding Date */}
          <p
            className="font-cormorant mt-4 text-lg tracking-[0.2em] sm:text-xl md:text-2xl"
            style={{ color: '#c08b8b' }}
          >
            13. Juni 2026
          </p>
        </div>
      </section>

      {/* Countdown Section */}
      <section id="countdown" className="relative z-10 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-playfair text-2xl tracking-wide sm:text-3xl md:text-4xl" style={{ color: '#d4a5a5' }}>
            Countdown bis zum großen Tag
          </h2>
          <p className="font-cormorant mt-2 text-base tracking-wide sm:text-lg" style={{ color: '#8b8b8b' }}>
            13. Juni 2026
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {[
              { value: isClient ? timeLeft.days : 0, label: 'Tage' },
              { value: isClient ? timeLeft.hours : 0, label: 'Stunden' },
              { value: isClient ? timeLeft.minutes : 0, label: 'Minuten' },
              { value: isClient ? timeLeft.seconds : 0, label: 'Sekunden' },
            ].map((item) => (
              <div
                key={item.label}
                className="countdown-box rounded-lg border-2 px-4 py-6 sm:px-6 sm:py-8"
                style={{ borderColor: '#e8c5c5', backgroundColor: 'rgba(255,255,255,0.7)' }}
              >
                <span
                  className="font-playfair block text-4xl font-semibold sm:text-5xl md:text-6xl"
                  style={{ color: '#d4a5a5' }}
                >
                  {item.value.toString().padStart(2, '0')}
                </span>
                <span
                  className="font-cormorant mt-2 block text-sm tracking-wide sm:text-base"
                  style={{ color: '#8b8b8b' }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="locations" className="relative z-10 px-6 py-16 md:py-24" style={{ backgroundColor: 'rgba(232, 197, 197, 0.15)' }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="font-playfair text-center text-2xl tracking-wide sm:text-3xl md:text-4xl" style={{ color: '#d4a5a5' }}>
            Wichtige Adressen
          </h2>
          <p className="font-cormorant mt-2 text-center text-base tracking-wide sm:text-lg" style={{ color: '#8b8b8b' }}>
            Hier findet ihr uns
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {locations.map((location, index) => (
              <div
                key={index}
                className="location-card overflow-hidden rounded-xl bg-white shadow-lg"
                style={{ borderTop: '4px solid #d4a5a5' }}
              >
                {/* Map Embed */}
                <div className="h-48 w-full bg-gray-100">
                  <iframe
                    src={location.embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map - ${location.name}`}
                  />
                </div>

                {/* Location Details */}
                <div className="p-6">
                  <span
                    className="font-cormorant text-xs font-medium uppercase tracking-widest"
                    style={{ color: '#c08b8b' }}
                  >
                    {location.subtitle}
                  </span>
                  <h3 className="font-playfair mt-2 text-xl font-semibold" style={{ color: '#4a4a4a' }}>
                    {location.name}
                  </h3>
                  <div className="mt-3 space-y-1">
                    <p className="font-cormorant text-base" style={{ color: '#6b6b6b' }}>
                      {location.address}
                    </p>
                    <p className="font-cormorant text-base" style={{ color: '#6b6b6b' }}>
                      {location.city}
                    </p>
                  </div>

                  <a
                    href={location.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#d4a5a5', color: '#fff' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c08b8b')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d4a5a5')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    In Google Maps öffnen
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="relative z-10 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-playfair text-center text-2xl tracking-wide sm:text-3xl md:text-4xl" style={{ color: '#d4a5a5' }}>
            Tagesablauf
          </h2>
          <p className="font-cormorant mt-2 text-center text-base tracking-wide sm:text-lg" style={{ color: '#8b8b8b' }}>
            Was euch am großen Tag erwartet
          </p>

          <div className="mt-12">
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-6 top-0 h-full w-0.5 sm:left-8"
                style={{ backgroundColor: '#e8c5c5' }}
              />

              {/* Schedule items */}
              <div className="space-y-6">
                {scheduleItems.map((item, index) => (
                  <div key={index} className="relative flex items-start gap-4 sm:gap-6">
                    {/* Timeline dot */}
                    <div
                      className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl sm:h-16 sm:w-16 sm:text-2xl"
                      style={{ backgroundColor: item.isBreak ? '#f5e6e0' : '#d4a5a5' }}
                    >
                      {item.emoji}
                    </div>

                    {/* Content */}
                    <div
                      className={`flex-1 rounded-lg p-4 sm:p-5 ${item.isBreak ? 'border-2 border-dashed' : ''}`}
                      style={{
                        backgroundColor: item.isBreak ? 'transparent' : 'rgba(255,255,255,0.8)',
                        borderColor: item.isBreak ? '#c9b1a0' : 'transparent',
                        boxShadow: item.isBreak ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    >
                      {item.time && (
                        <span
                          className="font-playfair text-lg font-semibold sm:text-xl"
                          style={{ color: '#c08b8b' }}
                        >
                          {item.time} Uhr
                        </span>
                      )}
                      <p
                        className={`font-cormorant text-base sm:text-lg ${item.time ? 'mt-1' : ''}`}
                        style={{ color: item.isBreak ? '#8b8b8b' : '#4a4a4a', fontStyle: item.isBreak ? 'italic' : 'normal' }}
                      >
                        {item.event}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Information Section */}
      <section id="info" className="relative z-10 px-6 py-16 md:py-24" style={{ backgroundColor: 'rgba(232, 197, 197, 0.15)' }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="font-playfair text-center text-2xl tracking-wide sm:text-3xl md:text-4xl" style={{ color: '#d4a5a5' }}>
            Wichtige Informationen
          </h2>
          <p className="font-cormorant mt-2 text-center text-base tracking-wide sm:text-lg" style={{ color: '#8b8b8b' }}>
            Alles was ihr wissen müsst
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Parking Info */}
            <div className="info-card rounded-xl bg-white p-6 shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: '#f5e6e0' }}>
                🅿️
              </div>
              <h3 className="font-playfair text-lg font-semibold" style={{ color: '#4a4a4a' }}>
                Parken
              </h3>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="font-cormorant font-medium" style={{ color: '#6b6b6b' }}>
                    Parkhaus Galeria
                  </p>
                  <p className="font-cormorant text-sm" style={{ color: '#8b8b8b' }}>
                    Hirnbeinstraße 7, 87435 Kempten
                  </p>
                </div>
                <div>
                  <p className="font-cormorant font-medium" style={{ color: '#6b6b6b' }}>
                    Parkplatz St.-Mang-Kirche
                  </p>
                  <p className="font-cormorant text-sm" style={{ color: '#8b8b8b' }}>
                    St.-Mang-Platz 12, 87435 Kempten
                  </p>
                </div>
              </div>
            </div>

            {/* Dress Code */}
            <div className="info-card rounded-xl bg-white p-6 shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: '#f5e6e0' }}>
                👗
              </div>
              <h3 className="font-playfair text-lg font-semibold" style={{ color: '#4a4a4a' }}>
                Kleiderordnung
              </h3>
              <div className="mt-3 space-y-2">
                <p className="font-cormorant text-base" style={{ color: '#6b6b6b' }}>
                  Wir freuen uns, wenn ihr in zahlreichen Farben zu unserer Hochzeit kommt.
                </p>
                <p className="font-cormorant text-base" style={{ color: '#8b8b8b', fontStyle: 'italic' }}>
                  Nur das weiße Kleid ist bereits für die Braut reserviert ;)
                </p>
              </div>
            </div>

            {/* Menu Selection */}
            <div className="info-card rounded-xl bg-white p-6 shadow-md sm:col-span-2 lg:col-span-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: '#f5e6e0' }}>
                🍽️
              </div>
              <h3 className="font-playfair text-lg font-semibold" style={{ color: '#4a4a4a' }}>
                Essen
              </h3>
              <div className="mt-3">
                <p className="font-cormorant text-base" style={{ color: '#6b6b6b' }}>
                  Wir bitten dich, dein Menü für den großen Tag hier vorzubestellen:
                </p>
                <button
                  onClick={() => openMenuModal()}
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#d4a5a5', color: '#fff' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c08b8b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d4a5a5')}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Menüauswahl
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seating Chart Section */}
      <section id="seating" className="relative z-10 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-playfair text-center text-2xl tracking-wide sm:text-3xl md:text-4xl" style={{ color: '#d4a5a5' }}>
            Sitzordnung
          </h2>
          <p className="font-cormorant mt-2 text-center text-base tracking-wide sm:text-lg" style={{ color: '#8b8b8b' }}>
            Eure Plätze am Hochzeitstisch
          </p>

          {/* Seating Chart Visual */}
          <div className="mt-12 flex flex-col items-center">
            {/* Bride and Groom at Head of Table */}
            <div className="mb-6 flex justify-center gap-4 sm:gap-8">
              {/* Bride Seat */}
              <div 
                className="flex items-center justify-center rounded-full border-2 bg-white px-4 py-2 shadow-sm transition-all hover:shadow-md sm:px-6 sm:py-3"
                style={{ borderColor: '#d4a5a5' }}
              >
                <div className="text-center">
                  <span className="font-cormorant block text-xs uppercase tracking-wider" style={{ color: '#c08b8b' }}>Braut</span>
                  <span className="font-playfair text-sm font-medium sm:text-base" style={{ color: '#4a4a4a' }}>{seatingArrangement.bride}</span>
                </div>
              </div>
              {/* Groom Seat */}
              <div 
                className="flex items-center justify-center rounded-full border-2 bg-white px-4 py-2 shadow-sm transition-all hover:shadow-md sm:px-6 sm:py-3"
                style={{ borderColor: '#d4a5a5' }}
              >
                <div className="text-center">
                  <span className="font-cormorant block text-xs uppercase tracking-wider" style={{ color: '#c08b8b' }}>Bräutigam</span>
                  <span className="font-playfair text-sm font-medium sm:text-base" style={{ color: '#4a4a4a' }}>{seatingArrangement.groom}</span>
                </div>
              </div>
            </div>

            {/* Table with Guests on Both Sides */}
            <div className="flex w-full max-w-2xl items-stretch justify-center gap-2 sm:gap-4">
              {/* Bride's Side (Left) */}
              <div className="flex flex-col items-end gap-3 sm:gap-4">
                <span className="font-cormorant mb-2 text-xs uppercase tracking-wider sm:text-sm" style={{ color: '#c08b8b' }}>
                  Brautseite
                </span>
                {seatingArrangement.bridesSide.map((guest, index) => (
                  <div
                    key={index}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-all hover:bg-[#f5e6e0] hover:shadow-md sm:h-16 sm:w-16 md:h-20 md:w-20"
                    style={{ borderColor: '#e8c5c5' }}
                    title={guest}
                  >
                    <span className="font-cormorant text-center text-[10px] leading-tight sm:text-xs md:text-sm" style={{ color: '#4a4a4a' }}>
                      {guest.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div 
                className="mx-2 w-10 flex-shrink-0 self-stretch rounded-lg border-2 sm:mx-4 sm:w-14 md:w-16"
                style={{ 
                  borderColor: '#e8c5c5', 
                  backgroundColor: 'rgba(232, 197, 197, 0.1)',
                  marginTop: '28px'
                }}
              >
                <div className="flex h-full items-center justify-center">
                  <span 
                    className="font-cormorant text-xs tracking-wider sm:text-sm" 
                    style={{ 
                      color: '#c9b1a0', 
                      writingMode: 'vertical-rl', 
                      textOrientation: 'mixed',
                      transform: 'rotate(180deg)'
                    }}
                  >
                    TISCH
                  </span>
                </div>
              </div>

              {/* Groom's Side (Right) */}
              <div className="flex flex-col items-start gap-3 sm:gap-4">
                <span className="font-cormorant mb-2 text-xs uppercase tracking-wider sm:text-sm" style={{ color: '#c08b8b' }}>
                  Bräutigamseite
                </span>
                {seatingArrangement.groomsSide.map((guest, index) => (
                  <div
                    key={index}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-all hover:bg-[#f5e6e0] hover:shadow-md sm:h-16 sm:w-16 md:h-20 md:w-20"
                    style={{ borderColor: '#e8c5c5' }}
                    title={guest}
                  >
                    <span className="font-cormorant text-center text-[10px] leading-tight sm:text-xs md:text-sm" style={{ color: '#4a4a4a' }}>
                      {guest.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Name Cards Info Note */}
            <div className="mt-10 rounded-xl border-2 border-dashed p-4 sm:p-6" style={{ borderColor: '#c9b1a0', backgroundColor: 'rgba(201, 177, 160, 0.08)' }}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xl" style={{ backgroundColor: '#f5e6e0' }}>
                  🏷️
                </div>
                <div>
                  <h4 className="font-playfair text-base font-semibold sm:text-lg" style={{ color: '#4a4a4a' }}>
                    Namenskärtchen
                  </h4>
                  <p className="font-cormorant mt-1 text-sm sm:text-base" style={{ color: '#6b6b6b' }}>
                    An jedem Platz findet ihr ein personalisiertes Namenskärtchen, das euren Sitzplatz markiert.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section id="gallery" className="relative z-10 px-6 py-16 md:py-24" style={{ backgroundColor: 'rgba(232, 197, 197, 0.15)' }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="font-playfair text-center text-2xl tracking-wide sm:text-3xl md:text-4xl" style={{ color: '#d4a5a5' }}>
            Fotogalerie
          </h2>
          <p className="font-cormorant mt-2 text-center text-base tracking-wide sm:text-lg" style={{ color: '#8b8b8b' }}>
            Unsere schönsten Momente
          </p>

          {/* Admin Upload Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAdminUploadModal(true)}
              className="font-cormorant text-sm underline transition-colors hover:text-[#c08b8b]"
              style={{ color: '#8b8b8b' }}
            >
              Admin: Fotos hochladen
            </button>
          </div>

          {/* Photo Grid - Masonry Layout */}
          {photos.length > 0 ? (
            <div className="mt-10 columns-2 gap-4 sm:columns-3 lg:columns-4">
              {photos.map((photo) => (
                <div
                  key={photo.key}
                  className="gallery-item mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    loading="lazy"
                    className="h-auto w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: '#e8c5c5' }}>
              <div className="mb-4 text-4xl">📷</div>
              <p className="font-cormorant text-base" style={{ color: '#8b8b8b' }}>
                Noch keine Fotos vorhanden.
              </p>
              <p className="font-cormorant mt-1 text-sm" style={{ color: '#8b8b8b' }}>
                Die Fotos werden nach der Hochzeit hier erscheinen.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Closing Section */}
      <section className="relative z-10 px-6 pt-20 pb-40 md:pt-28 md:pb-56">
        <div className="mx-auto max-w-2xl text-center">
          {/* Decorative divider */}
          <div className="mb-10 flex items-center justify-center gap-4">
            <div className="h-px w-16 sm:w-24" style={{ backgroundColor: '#e8c5c5' }} />
            <span style={{ color: '#d4a5a5' }}>♥</span>
            <div className="h-px w-16 sm:w-24" style={{ backgroundColor: '#e8c5c5' }} />
          </div>

          <p
            className="font-cormorant text-lg leading-relaxed sm:text-xl md:text-2xl"
            style={{ color: '#6b6b6b' }}
          >
            Wir freuen uns diesen besonderen Tag mit Euch feiern zu dürfen.
          </p>

          <p
            className="font-great-vibes mt-8 text-3xl sm:text-4xl md:text-5xl"
            style={{ color: '#c9b1a0' }}
          >
            Eure Lilly und euer Fatih
          </p>
        </div>
      </section>

      {/* Upper Right Rose */}
      <div className="animate-fly-in-right pointer-events-none absolute -right-4 -top-4 z-0 w-56 sm:w-64 md:w-80 lg:w-96">
        <div style={{ 
          transformOrigin: 'top right',
          animation: 'roseSwayRight 4s ease-in-out infinite'
        }}>
          <Image
            src="/Rose-Right-Cornern.png"
            alt="Rose decoration"
            width={400}
            height={400}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>

      {/* Lower Left Rose */}
      <div className="animate-fly-in-left pointer-events-none absolute -bottom-4 -left-4 z-0 w-56 sm:w-64 md:w-80 lg:w-96">
        <div style={{
          transformOrigin: 'bottom left',
          animation: 'roseSwayLeft 4.5s ease-in-out infinite'
        }}>
          <Image
            src="/Rose-Left-Corner.png"
            alt="Rose decoration"
            width={400}
            height={400}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>

      {/* Floating Petals */}
      {petalConfigs.map((petal) => {
        const positionStyle = petal.corner === 'tr'
          ? { top: petal.top, right: petal.right }
          : { bottom: petal.bottom, left: petal.left };

        return (
          <div
            key={petal.id}
            className={`petal petal-${petal.id}`}
            style={{
              ...positionStyle,
              animationDelay: petal.delay,
            }}
          >
            <Image
              src={petal.src}
              alt=""
              width={petal.size}
              height={petal.size}
              className="h-auto w-auto"
            />
          </div>
        );
      })}

      {/* Menu Selection Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div 
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            style={{ backgroundColor: '#fdfbfa' }}
          >
            {/* Close Button */}
            <button
              onClick={closeMenuModal}
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="#6b6b6b" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6 text-center">
              <h2 className="font-playfair text-2xl" style={{ color: '#d4a5a5' }}>
                Menüauswahl
              </h2>
            </div>

            {/* Coming Soon Message */}
            <div className="text-center py-8">
              <div className="mb-6 text-6xl">🍽️</div>
              <h3 className="font-playfair text-xl mb-3" style={{ color: '#4a4a4a' }}>
                Noch nicht verfügbar
              </h3>
              <p className="font-cormorant text-base mb-4" style={{ color: '#6b6b6b' }}>
                Die Menüauswahl wird derzeit noch vorbereitet.
              </p>
              <p className="font-cormorant text-base" style={{ color: '#6b6b6b' }}>
                Bald könnt ihr hier eure Speisen und Getränke für den großen Tag auswählen.
              </p>
              <div className="mt-8 rounded-xl border-2 border-dashed p-4" style={{ borderColor: '#e8c5c5', backgroundColor: 'rgba(232, 197, 197, 0.1)' }}>
                <p className="font-cormorant text-sm" style={{ color: '#8b8b8b', fontStyle: 'italic' }}>
                  Wir informieren euch, sobald die Auswahl bereit ist!
                </p>
              </div>
              <button
                onClick={closeMenuModal}
                className="mt-8 rounded-full px-6 py-2 font-medium text-white transition-colors"
                style={{ backgroundColor: '#d4a5a5' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c08b8b')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d4a5a5')}
              >
                Verstanden
              </button>
            </div>

                      </div>
        </div>
      )}

      {/* Guest List Modal */}
      {showGuestListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div 
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            style={{ backgroundColor: '#fdfbfa' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowGuestListModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="#6b6b6b" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6 text-center">
              <h2 className="font-playfair text-2xl" style={{ color: '#d4a5a5' }}>
                Gästeliste
              </h2>
              <p className="font-cormorant mt-1 text-base" style={{ color: '#8b8b8b' }}>
                {guestList.length} Gäste eingeladen
              </p>
            </div>

            {/* Guests grouped by family */}
            <div className="space-y-4">
              {['Karaoglu', 'Ehmling', 'Wetzel', 'Schneider', 'Kasan'].map((family) => {
                const familyGuests = guestList.filter(g => g.family === family);
                if (familyGuests.length === 0) return null;
                return (
                  <div key={family}>
                    <h3 className="font-playfair mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: '#c08b8b' }}>
                      Familie {family}
                    </h3>
                    <div className="space-y-1">
                      {familyGuests.map((guest) => (
                        <div
                          key={guest.name}
                          className="rounded-lg px-3 py-2"
                          style={{ backgroundColor: 'rgba(232, 197, 197, 0.15)' }}
                        >
                          <span className="font-cormorant text-base" style={{ color: '#4a4a4a' }}>
                            {guest.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Export Button */}
            <div className="mt-6 border-t pt-4" style={{ borderColor: '#e8c5c5' }}>
              <button
                onClick={exportOrdersAsCSV}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-2 font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#d4a5a5' }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#c08b8b')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#d4a5a5')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isLoading ? 'Exportiere...' : 'Bestellungen als CSV exportieren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-2 shadow-lg transition-colors hover:bg-gray-100 sm:-right-4 sm:-top-4"
            >
              <svg className="h-5 w-5" fill="none" stroke="#6b6b6b" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.filename}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />

            {/* Action Buttons */}
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => handleDownloadPhoto(lightboxPhoto)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: '#d4a5a5' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c08b8b')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d4a5a5')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Herunterladen
              </button>
              {isAdminAuthenticated && (
                <button
                  onClick={() => handleDeletePhoto(lightboxPhoto)}
                  className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Löschen
                </button>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = photos.findIndex(p => p.key === lightboxPhoto.key);
                  const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
                  setLightboxPhoto(photos[prevIndex]);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 transition-colors hover:bg-white sm:left-4 sm:p-3"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="#6b6b6b" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = photos.findIndex(p => p.key === lightboxPhoto.key);
                  const nextIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
                  setLightboxPhoto(photos[nextIndex]);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 transition-colors hover:bg-white sm:right-4 sm:p-3"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="#6b6b6b" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Admin Upload Modal */}
      {showAdminUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div 
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            style={{ backgroundColor: '#fdfbfa' }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowAdminUploadModal(false);
                if (!isAdminAuthenticated) {
                  setAdminPassword('');
                }
              }}
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="#6b6b6b" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6 text-center">
              <h2 className="font-playfair text-2xl" style={{ color: '#d4a5a5' }}>
                Fotos hochladen
              </h2>
              <p className="font-cormorant mt-1 text-base" style={{ color: '#8b8b8b' }}>
                Admin-Bereich
              </p>
            </div>

            {!isAdminAuthenticated ? (
              /* Password Entry */
              <div>
                <p className="font-cormorant mb-4 text-center text-base" style={{ color: '#6b6b6b' }}>
                  Bitte gib das Admin-Passwort ein:
                </p>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
                  placeholder="Passwort"
                  className="w-full rounded-lg border-2 p-3 font-cormorant outline-none focus:border-[#d4a5a5]"
                  style={{ borderColor: '#e8c5c5' }}
                />
                <button
                  onClick={handleAdminAuth}
                  disabled={!adminPassword}
                  className="mt-4 w-full rounded-full px-6 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: adminPassword ? '#d4a5a5' : '#ccc' }}
                  onMouseEnter={(e) => adminPassword && (e.currentTarget.style.backgroundColor = '#c08b8b')}
                  onMouseLeave={(e) => adminPassword && (e.currentTarget.style.backgroundColor = '#d4a5a5')}
                >
                  Anmelden
                </button>
              </div>
            ) : (
              /* Upload Interface */
              <div>
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging ? 'border-[#d4a5a5] bg-[#f5e6e0]/30' : 'border-[#e8c5c5]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <div className="mb-3 text-4xl">📤</div>
                  <p className="font-cormorant text-base" style={{ color: '#6b6b6b' }}>
                    Fotos hier ablegen oder klicken zum Auswählen
                  </p>
                  <p className="font-cormorant mt-1 text-sm" style={{ color: '#8b8b8b' }}>
                    Mehrere Bilder auf einmal möglich
                  </p>
                </div>

                {/* Upload Progress */}
                {uploadProgress && (
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between">
                      <span className="font-cormorant text-sm" style={{ color: '#6b6b6b' }}>
                        Hochladen...
                      </span>
                      <span className="font-cormorant text-sm" style={{ color: '#6b6b6b' }}>
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full transition-all"
                        style={{
                          backgroundColor: '#d4a5a5',
                          width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Uploaded Photos Count */}
                <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: '#f5e6e0' }}>
                  <p className="font-cormorant text-center text-base" style={{ color: '#4a4a4a' }}>
                    <strong>{photos.length}</strong> Fotos in der Galerie
                  </p>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setIsAdminAuthenticated(false);
                    setAdminPassword('');
                  }}
                  className="mt-4 w-full font-cormorant text-sm underline transition-colors hover:text-[#c08b8b]"
                  style={{ color: '#8b8b8b' }}
                >
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
