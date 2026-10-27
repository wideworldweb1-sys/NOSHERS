import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Room, RoomEvent } from 'livekit-client';
import { createRoot } from 'react-dom/client';
import {
  AudioLines, Search, Bell, Plus, Mic, MicOff, Headphones, Crown, Gift,
  Users, Compass, House, UserRound, Camera, Settings, Sparkles, Heart, X, Radio,
  ShieldCheck, ChevronRight, Coins, LogIn
} from 'lucide-react';
import './styles.css';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const initialRooms = [
  { id: 1, title: 'Late Night Thoughts 🌙', topic: 'Deep talks • no judgment', host: 'Mira', listeners: 128, speakers: ['Mira', 'Zayn', 'Luna'], tag: 'TRENDING', color: 'rose', avatar: 'M', live: true, theme: 'dragon-lair' },
  { id: 2, title: 'The Midnight Lounge', topic: 'Music, stories & good energy', host: 'Ray', listeners: 86, speakers: ['Ray', 'Ayla', 'Noor'], tag: 'CHILL', color: 'blue', avatar: 'R', live: true },
  { id: 3, title: 'Unfiltered & Unbothered', topic: 'Real conversations only', host: 'Sana', listeners: 64, speakers: ['Sana', 'Kian'], tag: 'POPULAR', color: 'gold', avatar: 'S', live: true },
  { id: 4, title: 'Soft Hearts Club 💜', topic: 'Meet people, make connections', host: 'Ari', listeners: 42, speakers: ['Ari', 'Jules'], tag: 'NEW', color: 'violet', avatar: 'A', live: true },
];

const gifts = [
  { name: 'Rose', emoji: '🌹', coins: 20 },
  { name: 'Coffee', emoji: '☕', coins: 50 },
  { name: 'Crown', emoji: '👑', coins: 250 },
  { name: 'Galaxy', emoji: '🌌', coins: 1000 },
];

function App() {
  const [page, setPage] = useState('Discover');
  const [rooms, setRooms] = useState(() => {
  try {
    const savedRooms = localStorage.getItem('noshers-rooms');

if (savedRooms) {
  const parsedRooms = JSON.parse(savedRooms);

  if (Array.isArray(parsedRooms) && parsedRooms.length > 0) {
    return parsedRooms;
  }
}

return initialRooms;
  } catch {
    return initialRooms;
  }
});
  const [activeRoom, setActiveRoom] = useState(null);
  const [muted, setMuted] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [selectedGiftRecipient, setSelectedGiftRecipient] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [displayName, setDisplayName] = useState(localStorage.getItem('noshers-display-name') || '');
const [profilePhoto, setProfilePhoto] = useState(localStorage.getItem('noshers-profile-photo') || '');
  const [user, setUser] = useState(null);
const [authEmail, setAuthEmail] = useState('');
const [authPassword, setAuthPassword] = useState('');
const [authMode, setAuthMode] = useState('login');
const [authLoading, setAuthLoading] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [toast, setToast] = useState('');
  const [coins, setCoins] = useState(1200);
  const [sentGifts, setSentGifts] = useState([]);
  const [activePremiumGift, setActivePremiumGift] = useState(null);
  useEffect(() => {
  if (!activePremiumGift) return;

  const timer = setTimeout(() => {
    setActivePremiumGift(null);
  }, 8000);

  return () => clearTimeout(timer);
}, [activePremiumGift]);
  const [liveKitRoom, setLiveKitRoom] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
const [speakerRequests, setSpeakerRequests] = useState([]);
const [micSeatAssignments, setMicSeatAssignments] = useState([]);
  const [activeSpeakerIdentities, setActiveSpeakerIdentities] = useState([]);
const [isHandRaised, setIsHandRaised] = useState(false);

const [mutedParticipants, setMutedParticipants] = useState([]);
const [isSpeaker, setIsSpeaker] = useState(false);
const [roomProgress, setRoomProgress] = useState({
  roomXp: 0,
  roomLevel: 1,
  micCount: 5
});
const [roomProgressLoading, setRoomProgressLoading] = useState(false);
  useEffect(() => {
    document
      .querySelectorAll('audio[data-participant-identity]')
      .forEach((audio) => {
        const identity = audio.dataset.participantIdentity;
        audio.muted = mutedParticipants.includes(identity);
      });
  }, [mutedParticipants]);

  useEffect(() => {
    if (!activeRoom) {
      setConnectionStatus('Disconnected');
      return;
    }

    let room;
let cancelled = false;
let activityStarted = false;
let activityTimer = null;
    async function connectToLiveKit() {
      try {
        setConnectionStatus('Connecting...');
const { data: { session } } = await supabase.auth.getSession();
        console.log('NOSHERS session check:', !!session?.access_token);
        const response = await fetch(
          `${import.meta.env.VITE_TOKEN_SERVER_URL || 'https://noshers-server.onrender.com'}/api/livekit/token`,
          {
            method: 'POST',
   headers: {
  'Content-Type': 'application/json',
  ...(session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {})
},
            body: JSON.stringify({
              roomName: activeRoom.title,
              participantName: localStorage.getItem('noshers-display-name') || `Guest-${Math.random().toString(36).slice(2, 6)}`
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not get a voice token.');
        }

        room = new Room();

      

room.on(RoomEvent.Disconnected, () => {
  if (activityTimer !== null) {
    clearInterval(activityTimer);
    activityTimer = null;
  }

  if (activityStarted) {
    activityStarted = false;

    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        await fetch(
          `${import.meta.env.VITE_TOKEN_SERVER_URL || 'https://noshers-server.onrender.com'}/api/room-activity/end`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token
                ? { Authorization: `Bearer ${session.access_token}` }
                : {})
            },
            body: JSON.stringify({
              roomId: activeRoom.title
            })
          }
        );
      } catch (error) {
        console.error('Could not end room activity:', error);
      }
    })();
  }

  setConnectionStatus('Disconnected');
  setLiveKitRoom(null);
  setSentGifts([]);
  setActivePremiumGift(null);
});


        await room.connect(data.url, data.token);
      
        const activitySessionResponse = await fetch(
          `${import.meta.env.VITE_TOKEN_SERVER_URL || 'https://noshers-server.onrender.com'}/api/room-activity/start`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token
                ? { Authorization: `Bearer ${session.access_token}` }
                : {})
            },
            body: JSON.stringify({
              roomId: activeRoom.title
            })
          }
        );

const activityStartResult = await activitySessionResponse.clone().json().catch(() => ({}));

console.log(
  'ROOM ACTIVITY START:',
  activitySessionResponse.status,
  activityStartResult
);

activityStarted = activitySessionResponse.ok;

if (!activityStarted) {
  console.error('Could not start room activity:', activityStartResult);
}

if (activityStarted && !cancelled) {
  activityTimer = setInterval(async () => {
    if (cancelled || !activityStarted) {
      clearInterval(activityTimer);
      activityTimer = null;
      return;
    }

    try {
      const { data: { session: currentSession } } =
        await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        console.error('XP award skipped: user session missing.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_TOKEN_SERVER_URL || 'https://noshers-server.onrender.com'}/api/room-activity/award`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession.access_token}`
          },
          body: JSON.stringify({
            roomId: activeRoom.title
          })
        }
      );

      if (!response.ok) {
        console.error('Room XP award request failed.');
        return;
      }

      const result = await response.json();

      if (result.awardedXp > 0) {
        notify(`🎉 Room earned ${result.awardedXp} XP!`);
      }
    } catch (error) {
      console.error('Room XP award error:', error);
    }
  }, 5 * 60 * 1000);
}



room.on(RoomEvent.DataReceived, (payload, participant) => {
  try {
    const message = JSON.parse(new TextDecoder().decode(payload));
if (
  message.type === 'mic_seat_assignments' &&
  Array.isArray(message.assignments)
) {
  setMicSeatAssignments(message.assignments);
}
    if (message.type === 'hand_raise') {
      const name =
        message.name ||
        participant?.name ||
        participant?.identity ||
        'Participant';

      setSpeakerRequests((prev) => {
        const others = prev.filter((request) => request.identity !== participant?.identity);

        if (!message.raised) {
          return others;
        }

        return [
          ...others,
          {
            identity: participant?.identity || name,
            name
          }
        ];
      });

      notify(
        message.raised
          ? `${name} raised their hand ✋`
          : `${name} lowered their hand`
      );
    }

if (message.type === 'gift' && message.gift) {
  const senderName =
    message.senderName ||
    participant?.name ||
    participant?.identity ||
    'Someone';

  const recipientName = message.recipientName || 'the room';

  const newGift = {
    ...message.gift,
    sender: senderName,
    recipient: recipientName,
    id: Date.now()
  };

  setSentGifts((prev) => [...prev, newGift]);

  if (
    message.gift.name === 'Crown' ||
    message.gift.name === 'Galaxy'
  ) {
    setActivePremiumGift(newGift);
  }

  notify(
    `${message.gift.emoji} ${senderName} sent ${message.gift.name} to ${recipientName}!`
  );
}

  } catch (error) {
    console.error('Room data message error:', error);
  }
});

room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (track.kind === 'audio') {
    const audioElement = track.attach();
audioElement.dataset.participantIdentity = participant.identity;
audioElement.muted = mutedParticipants.includes(participant.identity);
    audioElement.autoplay = true;
    audioElement.setAttribute('playsinline', 'true');
    document.body.appendChild(audioElement);

    audioElement.play().catch((error) => {
      console.log('Audio playback needs user interaction:', error);
    });
  }
});

room.on(RoomEvent.TrackUnsubscribed, (track) => {
  track.detach().forEach((element) => element.remove());
});

room.on(RoomEvent.ParticipantConnected, (participant) => {
  setActiveRoom(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      listeners: room.remoteParticipants.size + 1,
      speakers: [room.localParticipant.name, ...Array.from(room.remoteParticipants.values()).map(p => p.name)]
    };
  });
});

room.on(RoomEvent.ParticipantDisconnected, () => {
  setActiveRoom(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      listeners: room.remoteParticipants.size + 1,
      speakers: [room.localParticipant.name, ...Array.from(room.remoteParticipants.values()).map(p => p.name)]
    };
  });
});
        
room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
  setActiveSpeakerIdentities(
    speakers.map((participant) => participant.identity)
  );
});

        if (cancelled) {
          await room.disconnect();
          return;
        }

        await room.localParticipant.setMicrophoneEnabled(false);

        if (cancelled) {
          await room.disconnect();
          return;
        }

        setLiveKitRoom(room);
        setMuted(true);
        setConnectionStatus('Connected');
      } catch (error) {
        if (!cancelled) {
          console.error('LiveKit connection error:', error);
          setConnectionStatus('Connection failed');
        }
      }
    }

    connectToLiveKit();

   
return () => {
  cancelled = true;

  if (activityTimer !== null) {
    clearInterval(activityTimer);
    activityTimer = null;
  }

  if (activityStarted) {
    activityStarted = false;

    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        await fetch(
          `${import.meta.env.VITE_TOKEN_SERVER_URL || 'https://noshers-server.onrender.com'}/api/room-activity/end`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token
                ? { Authorization: `Bearer ${session.access_token}` }
                : {})
            },
            body: JSON.stringify({
              roomId: activeRoom.title
            })
          }
        );
      } catch (error) {
        console.error('Could not end room activity during cleanup:', error);
      }
    })();
  }

  if (room) room.disconnect();
  setLiveKitRoom(null);
};

  }, [activeRoom?.title]);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };
  
  const handleAuth = async () => {
    setAuthLoading(true);

    try {
      const email = authEmail.trim();

      const { data, error } = authMode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password: authPassword,
          })
        : await supabase.auth.signInWithPassword({
            email,
            password: authPassword,
          });

      if (error) throw error;

      if (authMode === 'signup' && !data.session) {
        notify('Account created! Check your email to confirm.');
      } else {
        setUser(data.user);
        notify('Welcome to NOSHERS!');
      }
    } catch (error) {
      alert(error.message || 'Login failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

useEffect(() => {
  let cancelled = false;

  async function loadRooms() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_TOKEN_SERVER_URL || 'https://noshers-server.onrender.com'}/api/rooms`
      );

      if (!response.ok) return;

      const data = await response.json();

     if (
  !cancelled &&
  Array.isArray(data.rooms) &&
  data.rooms.length > 0
) {
  setRooms(data.rooms);
}
    } catch (error) {
      console.error('Could not load shared rooms:', error);
    }
  }

  loadRooms();

  const timer = window.setInterval(loadRooms, 3000);

  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, []);
  function getUnlockedMaxMics(level) {
  if (level >= 25) return 15;
  if (level >= 20) return 12;
  if (level >= 15) return 11;
  if (level >= 10) return 10;
  if (level >= 9) return 9;
  if (level >= 7) return 8;
  if (level >= 5) return 7;
  if (level >= 3) return 6;
  return 5;
}
  const filteredRooms = rooms.filter(r => `${r.title} ${r.topic} ${r.host}`.toLowerCase().includes(search.toLowerCase()));

async function createRoom(e) {
  e.preventDefault();
  if (!roomTitle.trim()) return;

  const room = {
    id: Date.now(),
    title: roomTitle.trim(),
    topic: roomTopic.trim() || 'Come say hello',
    host: 'You',
    listeners: 1,
    speakers: ['You'],
    tag: 'YOUR ROOM',
    color: 'violet',
        avatar: 'Y',
    live: true,
    level: 1,
    micCount: 5,
    unlockedMaxMics: getUnlockedMaxMics(1)
  };

  const updatedRooms = [room, ...rooms];

  try {
    const response = await fetch(
      `${import.meta.env.VITE_TOKEN_SERVER_URL || 'https://noshers-server.onrender.com'}/api/rooms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rooms: updatedRooms })
      }
    );

    if (!response.ok) {
      throw new Error('Could not save rooms');
    }

    setRooms(updatedRooms);
    setShowCreate(false);
    setRoomTitle('');
    setRoomTopic('');
    setActiveRoom(room);
    setMuted(true);
    notify('Room created and shared with other devices!');
  } catch (error) {
    console.error('Room save error:', error);
    notify('Room save failed. Please check the server.');
  }
}
  
async function loadRoomProgress(roomId) {
  if (!roomId) return;

  setRoomProgressLoading(true);

  try {
    const serverUrl =
      import.meta.env.VITE_TOKEN_SERVER_URL ||
      'https://noshers-server.onrender.com';

    const response = await fetch(
      `${serverUrl}/api/room-progress?roomId=${encodeURIComponent(roomId)}`
    );

    if (!response.ok) {
      throw new Error('Could not load room progress');
    }

    const data = await response.json();

    setRoomProgress({
      roomXp: Number(data.roomXp ?? 0),
      roomLevel: Number(data.roomLevel ?? 1),
      micCount: Number(data.micCount ?? 5)
    });
  } catch (error) {
    console.error('Room progress load error:', error);
  } finally {
    setRoomProgressLoading(false);
  }
}

async function syncMicSeatAssignments(assignments) {
  if (!liveKitRoom || connectionStatus !== 'Connected') {
    notify('Join a voice room before using mic seats.');
    return;
  }

  try {
    const message = new TextEncoder().encode(
      JSON.stringify({
        type: 'mic_seat_assignments',
        assignments
      })
    );

    await liveKitRoom.localParticipant.publishData(message, {
      reliable: true
    });

    setMicSeatAssignments(assignments);
  } catch (error) {
    console.error('Mic seat update error:', error);
    notify('Could not update mic seats. Please try again.');
  }
}

async function takeMicSeat(seatNumber) {
  if (!liveKitRoom || connectionStatus !== 'Connected') {
    return notify('Join a voice room first.');
  }

  const identity = liveKitRoom.localParticipant.identity;

  if (micSeatAssignments.some(seat => seat.identity === identity)) {
    return notify('Leave your current mic seat first.');
  }

  if (micSeatAssignments.some(seat => seat.seatNumber === seatNumber)) {
    return notify('This mic seat is already occupied.');
  }

  const newAssignment = {
    seatNumber,
    identity,
    name:
      liveKitRoom.localParticipant.name ||
      displayName ||
      'Participant'
  };

  await syncMicSeatAssignments([
    ...micSeatAssignments,
    newAssignment
  ]);
}

async function leaveMicSeat() {
  if (!liveKitRoom || connectionStatus !== 'Connected') {
    return notify('Join a voice room first.');
  }

  const identity = liveKitRoom.localParticipant.identity;

  if (!micSeatAssignments.some(seat => seat.identity === identity)) {
    return notify('You are not sitting on a mic seat.');
  }

  const remainingAssignments = micSeatAssignments.filter(
    seat => seat.identity !== identity
  );

  await syncMicSeatAssignments(remainingAssignments);
}


async function sendGift(gift) {
  if (!selectedGiftRecipient) {
    return notify('Please select a member first.');
  }

  if (coins < gift.coins) {
    return notify('Not enough coins.');
  }

  if (!liveKitRoom || connectionStatus !== 'Connected') {
    return notify('Join a voice room before sending gifts.');
  }

  const recipient = liveKitRoom.remoteParticipants.get(
    selectedGiftRecipient
  );

  if (!recipient) {
    return notify('That member is no longer in the room. Please select again.');
  }

  try {
    const senderName =
      liveKitRoom.localParticipant.name || 'Someone';

    const recipientName =
      recipient.name || recipient.identity;

    const giftData = {
      name: gift.name,
      emoji: gift.emoji,
      coins: gift.coins
    };

    const message = new TextEncoder().encode(
      JSON.stringify({
        type: 'gift',
        gift: giftData,
        senderName,
        recipientIdentity: recipient.identity,
        recipientName
      })
    );

    await liveKitRoom.localParticipant.publishData(message, {
      reliable: true
    });

    setCoins((prev) => prev - gift.coins);

    const newGift = {
      ...giftData,
      sender: 'You',
      recipient: recipientName,
      id: Date.now()
    };

    setSentGifts((prev) => [...prev, newGift]);

    if (gift.name === 'Crown' || gift.name === 'Galaxy') {
      setActivePremiumGift(newGift);
    }

    setShowGifts(false);
    setSelectedGiftRecipient('');

    notify(`${gift.emoji} ${gift.name} sent to ${recipientName}!`);
  } catch (error) {
    console.error('Gift send error:', error);
    notify('Gift could not be sent. Please try again.');
  }
}


  async function toggleMicrophone() {
    if (!liveKitRoom || connectionStatus !== 'Connected') {
      notify('Voice room is not connected yet.');
      return;
    }

    try {
      const nextMuted = !muted;
      await liveKitRoom.localParticipant.setMicrophoneEnabled(!nextMuted);
      setMuted(nextMuted);
      notify(nextMuted ? 'Microphone muted' : 'Microphone on');
    } catch (error) {
      console.error('Microphone error:', error);
      notify('Microphone access failed. Check browser permission.');
    }
  }

  function toggleParticipantMute(identity) {
    setMutedParticipants((prev) =>
      prev.includes(identity)
        ? prev.filter((id) => id !== identity)
        : [...prev, identity]
    );
  }

async function toggleRaiseHand() {
  if (!liveKitRoom || connectionStatus !== 'Connected') {
    notify('Voice room is not connected yet.');
    return;
  }

  try {
    const nextRaised = !isHandRaised;

    const message = new TextEncoder().encode(
      JSON.stringify({
        type: 'hand_raise',
        raised: nextRaised,
        name: liveKitRoom.localParticipant.name || 'Participant'
      })
    );

    await liveKitRoom.localParticipant.publishData(message, {
      reliable: true
    });

    setIsHandRaised(nextRaised);
    notify(nextRaised ? 'Hand raised ✋' : 'Hand lowered');
  } catch (error) {
    console.error('Raise hand error:', error);
    notify('Raise hand failed. Please try again.');
  }
}

  const navItems = [
    { label: 'Discover', icon: Compass },
    { label: 'Following', icon: Heart },
    { label: 'VIP Lounge', icon: Crown },
  ];

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#100d1c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAuth();
          }}
          style={{ width: '100%', maxWidth: 380, background: '#1d182c', padding: 28, borderRadius: 20, boxSizing: 'border-box' }}
        >
          <h1 style={{ textAlign: 'center', letterSpacing: 3 }}>NOSHERS</h1>
          <p style={{ textAlign: 'center', color: '#b9aecf' }}>Your voice. Your community.</p>

          <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>

          <label>Email address</label>
          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 13, margin: '8px 0 18px', borderRadius: 9, border: '1px solid #514565', background: '#100d1c', color: 'white' }}
          />

          <label>Password</label>
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            required
            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 13, margin: '8px 0 20px', borderRadius: 9, border: '1px solid #514565', background: '#100d1c', color: 'white' }}
          />

          <button type="submit" disabled={authLoading} style={{ width: '100%', padding: 14, border: 0, borderRadius: 9, background: '#a78bfa', color: '#160e26', fontWeight: 'bold', cursor: 'pointer' }}>
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'}
          </button>

          <p style={{ textAlign: 'center', color: '#c7bdd8' }}>
            {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </p>

          <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ width: '100%', padding: 12, border: '1px solid #514565', borderRadius: 9, background: 'transparent', color: 'white', cursor: 'pointer' }}>
            {authMode === 'login' ? 'Sign up' : 'Log in instead'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => { setPage('Discover'); setActiveRoom(null); }}>
          <span className="brand-mark"><AudioLines size={23}/></span>
          <span>NOSHERS<small>VOICE COMMUNITY</small></span>
        </button>
        <button className="create-btn" onClick={() => setShowCreate(true)}><Plus size={18}/> Create a room</button>
        <div className="side-label">YOUR SPACE</div>
        <nav>
          {navItems.map(({label, icon: Icon}) => (
            <button key={label} className={`nav-item ${page === label ? 'selected' : ''}`} onClick={() => {setPage(label); setActiveRoom(null);}}>
              <Icon size={18}/><span>{label}</span>{label === 'VIP Lounge' && <span className="nav-pill">VIP</span>}
            </button>
          ))}
        </nav>
        <div className="side-label room-label">LIVE RIGHT NOW <span className="live-dot"/></div>
        <div className="sidebar-rooms">
          
{rooms.slice(0, 3).map(room => (
  <button
    key={room.id}
    className="mini-room"
    onClick={() => {
      setActiveRoom(room);
      loadRoomProgress(room.id);
    }}
  >

            <span className={`avatar avatar-${room.color}`}>{room.avatar}</span><span className="mini-room-text"><b>{room.title}</b><small>{room.listeners} listening</small></span><span className="tiny-live"/>
          </button>))}
        </div>
        <div className="sidebar-bottom">
          <div className="wallet-card"><div className="wallet-top"><Coins size={17}/><span>YOUR COINS</span></div><strong>{coins.toLocaleString()}</strong><button onClick={() => notify('Secure coin purchases will be added in the billing phase.')}>Get coins <Plus size={14}/></button></div>
          <button className="profile-mini" onClick={() => setShowProfile(true)}><span className="avatar avatar-you">Y</span><span><b>Your profile</b><small>Free member</small></span><Settings size={16}/></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><AudioLines size={20}/></span><b>NOSHERS</b></div>
          <div className="breadcrumb"><span>Community</span><ChevronRight size={14}/><b>{activeRoom ? 'Live room' : page}</b></div>
          <div className="top-actions">
            <label className="search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find rooms, people..." /></label>
            <button className="icon-btn notification" onClick={() => notify('You’re all caught up!')} aria-label="Notifications"><Bell size={18}/><i/></button>
            <button className="user-chip" onClick={() => setShowProfile(true)}><span className="avatar avatar-you">Y</span><span>You</span></button>
          </div>
        </header>

        {activeRoom ? (
          <section className="room-page">
            <button className="back-link" onClick={() => setActiveRoom(null)}>← Back to discover</button>
            <div className={`room-hero hero-${activeRoom.color} ${activeRoom.theme === 'dragon-lair' ? 'theme-dragon-lair' : ''}`}>

<div className="room-hero-glow" />

<button
  type="button"
  className="room-hero-compact"
  onClick={() => setShowRoomDetails(true)}
>
  <span className={`avatar avatar-xl avatar-${activeRoom.color}`}>
    {activeRoom.avatar}
  </span>

  <span className="room-hero-compact-title">
    {activeRoom.title}
  </span>

  <span className="room-hero-compact-arrow">›</span>
</button>

            <div className="room-columns">
              <div className="speaker-panel panel"><div className="panel-heading"><h2>On stage</h2><span>
{liveKitRoom
  ? 1 + liveKitRoom.remoteParticipants.size
  : 0} speakers
</span></div>
<div className="speaker-grid">
  {liveKitRoom &&
    [
      liveKitRoom.localParticipant,
      ...Array.from(liveKitRoom.remoteParticipants.values())
    ].map((p, i) => (
      <div className="speaker" key={p.identity}>
        <div className={`speaker-avatar speaker-${i % 4}`}>
          
{p.identity === liveKitRoom.localParticipant.identity && profilePhoto ? (
  <img
    src={profilePhoto}
    alt={p.name || 'Profile'}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '50%'
    }}
  />
) : (
  p.name?.[0] || '?'
)}

          {i === 0 && (
            <span className="host-crown">
              <Crown size={12} />
            </span>
          )}
        </div>
        <b>{p.name || p.identity}</b>
        <small>{i === 0 ? 'You' : 'Participant'}</small>
        <span className="speaking-bars"><i/><i/><i/></span>

        {i !== 0 && (
          <button
            className="secondary-btn"
            onClick={() => toggleParticipantMute(p.identity)}
          >
            {mutedParticipants.includes(p.identity) ? 'Unmute' : 'Mute'}
          </button>
        )}
      </div>
    ))}
</div>
<div className="mic-seats-section">
  <div className="panel-heading">
    <h2>🎙️ Mic Seats</h2>
    <span>
      {micSeatAssignments.length}/{activeRoom.micCount || 5} occupied
    </span>
  </div>

  <div className="mic-seat-grid">
    {Array.from(
      { length: Math.min(activeRoom.micCount || 5, activeRoom.unlockedMaxMics || 5) },
      (_, i) => i + 1
    ).map((seatNumber) => {
      const assignment = micSeatAssignments.find(
        (seat) => seat.seatNumber === seatNumber
      );

      const isMine =
        assignment &&
        assignment.identity === liveKitRoom?.localParticipant.identity;

      return (
        <div
          
className={`mic-seat ${assignment ? 'mic-seat-occupied' : 'mic-seat-empty'} ${assignment && activeSpeakerIdentities.includes(assignment.identity) ? 'mic-seat-speaking' : ''}`}

          key={seatNumber}
        >
          <Mic size={24} />

          <b>
            {assignment ? assignment.name : `Mic ${seatNumber}`}
          </b>

          {assignment ? (
            isMine ? (
              <button
                className="secondary-btn"
                onClick={leaveMicSeat}
              >
                Leave seat
              </button>
            ) : (
              <small>Occupied</small>
            )
          ) : (
            <button
              className="secondary-btn"
              disabled={!liveKitRoom || connectionStatus !== 'Connected'}
              onClick={() => takeMicSeat(seatNumber)}
            >
              Take mic
            </button>
          )}
        </div>
      );
    })}
  </div>
</div>
{speakerRequests.length > 0 && (
  <div className="panel-heading">
    <h2>✋ Raised hands</h2>
    <span>{speakerRequests.length} requests</span>
    <div>
      {speakerRequests.map((request) => (
        <p key={request.identity}>
          ✋ {request.name}
        </p>
      ))}
    </div>
  </div>
)}

<div className="room-controls">
  <button
    className={`mic-button ${!muted ? 'mic-on' : ''}`}
    onClick={toggleMicrophone}
  >
    {muted ? <MicOff size={18}/> : <Mic size={18}/>}
    {muted ? 'Mic off' : 'Mic on'}
  </button>

 
<button
  className="secondary-btn"
  onClick={toggleRaiseHand}
>
  {isHandRaised ? '✋ Lower hand' : '✋ Raise hand'}
</button>
  <button
    className="secondary-btn gift-action"
    onClick={() => setShowGifts(true)}
  >
    <Gift size={17}/> Send a gift
  </button>
</div>
</div>

              <div className="chat-panel panel"><div className="panel-heading"><h2>Room chat</h2><span>Community</span></div><div className="chat-messages"><div className="chat-line"><span className="chat-avatar ca1">M</span><p><b>Mira</b><span>Welcome in, everyone 💜</span></p><small>now</small></div><div className="chat-line"><span className="chat-avatar ca2">Z</span><p><b>Zayn</b><span>Love this vibe ✨</span></p><small>1m</small></div><div className="chat-line"><span className="chat-avatar ca3">L</span><p><b>Luna</b><span>What are we talking about tonight?</span></p><small>2m</small></div>{sentGifts.map((g, i) => (
  <div className="gift-feed" key={i}>
    
{g.emoji} {g.sender === 'You' ? 'You sent' : `${g.sender} sent`} {g.name} to {g.recipient || 'the room'}

  </div>
))}</div><form className="chat-input" onSubmit={e => {e.preventDefault(); notify('Text chat will be enabled with account and backend setup.')}}><input placeholder="Say something kind..." /><button aria-label="Send message"><ChevronRight size={18}/></button></form></div>
            </div>
              
{showRoomDetails && (
  <div className="room-details-backdrop">
    <div className="room-details-panel">
      <button
        type="button"
        className="room-details-close"
        onClick={() => setShowRoomDetails(false)}
      >
        ✕
      </button>

      <h2>{activeRoom.title}</h2>
      <p>{activeRoom.topic || 'Welcome to our room!'}</p>

      <div className="room-details-info">
        <div>
          <span>🎙️ Host</span>
          <b>{activeRoom.host || 'Room Host'}</b>
        </div>

        <div>
          <span>👥 People in room</span>
          <b>
            {liveKitRoom
              ? 1 + liveKitRoom.remoteParticipants.size
              : 0}
          </b>
        </div>

        <div>
          <span>⭐ Room Level</span>
          <b>{activeRoom.level || 1}</b>
        </div>

        <div>
          <span>🎤 Mic Seats</span>
          <b>{activeRoom.micCount || 5}</b>
        </div>
      </div>
    </div>
  </div>
)}

            <div className="notice"><ShieldCheck size={17}/><span><b>Safe spaces matter.</b> Report, block, and moderation tools are part of the production launch checklist.</span></div>
          </section>
        ) : page === 'VIP Lounge' ? (
          <section className="content">
            <div className="vip-banner"><div className="vip-orb"><Crown size={32}/></div><span className="eyebrow">THE INNER CIRCLE</span><h1>More than a member.</h1><p>Stand out in every room with exclusive status, profile accents, and a little extra sparkle.</p><button className="primary-btn" onClick={() => notify('VIP checkout will be enabled after payment integration.')}>Explore VIP <ChevronRight size={17}/></button><div className="vip-stars">✦　✧　✦</div></div>
            <div className="section-heading"><div><h2>Choose your presence</h2><p>Membership options — preview only</p></div></div>
            <div className="vip-grid"><div className="vip-card"><span className="plan-icon silver"><Sparkles/></span><h3>VIP Silver</h3><p>For your everyday social life.</p><ul><li>Silver profile frame</li><li>VIP badge in rooms</li><li>Exclusive reactions</li></ul><button className="secondary-btn full" onClick={() => notify('VIP plan checkout is not connected yet.')}>View plan</button></div><div className="vip-card featured"><span className="featured-label">MOST LOVED</span><span className="plan-icon purple"><Crown/></span><h3>VIP Elite</h3><p>Make every entrance count.</p><ul><li>Animated profile frame</li><li>Elite room badge</li><li>Exclusive gift effects</li><li>Priority room discovery</li></ul><button className="primary-btn full" onClick={() => notify('VIP plan checkout is not connected yet.')}>Unlock Elite</button></div><div className="vip-card"><span className="plan-icon gold"><Sparkles/></span><h3>VIP Royal</h3><p>For the ones who set the tone.</p><ul><li>Royal profile styling</li><li>Premium room themes</li><li>Special entrance effect</li></ul><button className="secondary-btn full" onClick={() => notify('VIP plan checkout is not connected yet.')}>View plan</button></div></div>
          </section>
        ) : page === 'Following' ? (
          <section className="content"><div className="section-heading"><div><span className="eyebrow">YOUR PEOPLE</span><h1>Following</h1><p>Rooms from people you follow will show up here.</p></div></div><div className="empty-state"><Heart size={32}/><h2>Your circle starts here</h2><p>Explore live rooms and connect with people whose energy feels right.</p><button className="primary-btn" onClick={() => setPage('Discover')}>Discover rooms</button></div></section>
        ) : (
          <section className="content">
            <div className="welcome-row"><div><span className="eyebrow"><span className="live-dot"/> THE ROOM IS YOURS</span><h1>Good energy lives <em>here.</em></h1><p>Find your people. Join a conversation. Stay for the feeling.</p><div className="welcome-actions"><button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={17}/> Start a room</button><button className="secondary-btn" onClick={() => document.getElementById('rooms')?.scrollIntoView({behavior:'smooth'})}><Compass size={17}/> Explore rooms</button></div></div><div className="hero-art"><div className="art-ring ring-one"/><div className="art-ring ring-two"/><div className="art-center"><AudioLines size={54}/></div><span className="float-chip chip-a"><Radio size={15}/> Live now</span><span className="float-chip chip-b"><Headphones size={15}/> Your people</span><span className="float-chip chip-c">✦  Good energy</span></div></div>
            <div className="stats-row"><div><span className="stat-icon"><Radio size={17}/></span><span><b>{rooms.length + 18}</b><small>Live rooms</small></span></div><div><span className="stat-icon"><Users size={17}/></span><span><b>2.4k</b><small>People online</small></span></div><div><span className="stat-icon"><Sparkles size={17}/></span><span><b>Always</b><small>Something happening</small></span></div></div>
            <div className="section-heading" id="rooms"><div><span className="eyebrow">PICK YOUR VIBE</span><h2>Rooms worth staying for</h2><p>Conversations are better when you’re part of them.</p></div><button className="text-link" onClick={() => setSearch('')}>View all <ChevronRight size={16}/></button></div>
            <div className="room-grid">{filteredRooms.map(room => <article className="room-card" key={room.id} 
onClick={() => {
  setActiveRoom(room);
  setMuted(true);
  loadRoomProgress(room.id);
}}
><div className={`card-art card-${room.color}`}><span className="live-badge"><span className="live-dot"/> LIVE</span><span className="room-tag">{room.tag}</span><div className="card-orbit"><AudioLines size={32}/></div><div className="card-people">{room.speakers.slice(0,3).map((s,i)=><span className={`avatar avatar-${['rose','blue','gold'][i]}`} key={s}>{s[0]}</span>)}</div></div><div className="room-card-body"><h3>{room.title}</h3><p>{room.topic}</p><div className="card-footer"><span className="host-label">Hosted by <b>{room.host}</b></span><span className="listener-count"><Headphones size={14}/>{room.listeners}</span></div><div className="join-hover">Enter room <ChevronRight size={16}/></div></div></article>)}</div>
            {filteredRooms.length === 0 && <div className="empty-state"><Search size={28}/><h2>No rooms found</h2><p>Try another search, or create a new room.</p><button className="primary-btn" onClick={() => setShowCreate(true)}>Create a room</button></div>}
            <div className="gift-promo"><div className="promo-icon"><Gift size={26}/></div><div><span className="eyebrow">MAKE SOMEONE'S DAY</span><h2>Small gift. Big energy.</h2><p>Send a little appreciation to the voices that make your day.</p></div><button className="secondary-btn" onClick={() => setShowGifts(true)}>Explore gifts <ChevronRight size={16}/></button></div>
          </section>
        )}
        <footer><span>© 2026 NOSHERS</span><span>Be kind. Be real. Belong.</span><span>Community guidelines · Privacy</span></footer>
      </main>

      <nav className="mobile-nav">{[{label:'Discover',icon:House},{label:'Following',icon:Heart},{label:'Create',icon:Plus},{label:'VIP Lounge',icon:Crown},{label:'Profile',icon:UserRound}].map(({label,icon:Icon})=><button key={label} onClick={() => label==='Create'?setShowCreate(true):label==='Profile'?setShowProfile(true):(setPage(label),setActiveRoom(null))} className={page===label?'mobile-active':''}><Icon size={19}/><small>{label}</small></button>)}</nav>

      {showCreate && <div className="modal-backdrop" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowCreate(false)}><X size={18}/></button><span className="modal-icon"><Mic size={23}/></span><span className="eyebrow">BRING PEOPLE TOGETHER</span><h2>Create your room</h2><p>Give your conversation a name and invite the world in.</p><form onSubmit={createRoom}><label>Room name<input value={roomTitle} onChange={e=>setRoomTitle(e.target.value)} required maxLength={70} placeholder="e.g. After Hours ☾"/></label><label>What's the vibe? <input value={roomTopic} onChange={e=>setRoomTopic(e.target.value)} maxLength={100} placeholder="Music, stories, late night talks..."/></label><button className="primary-btn full" type="submit"><Plus size={17}/> Create room</button></form><small className="modal-footnote">Demo mode: real-time voice needs LiveKit credentials and a token server.</small></div></div>}

      {showGifts && <div className="modal-backdrop" onClick={() => setShowGifts(false)}><div className="modal gifts-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowGifts(false)}><X size={18}/></button><span className="modal-icon gift-modal-icon"><Gift size={23}/></span><span className="eyebrow">SPREAD THE GOOD ENERGY</span><h2>Send a little love</h2>
<p>Choose who you want to send a gift to.</p>

<label className="gift-recipient-label">
  Select a member
  <select
    value={selectedGiftRecipient}
    onChange={(e) => setSelectedGiftRecipient(e.target.value)}
  >
    <option value="">Choose a member...</option>
    {liveKitRoom &&
      Array.from(liveKitRoom.remoteParticipants.values()).map((p) => (
        <option key={p.identity} value={p.identity}>
          {p.name || p.identity}
        </option>
      ))}
  </select>
</label>
<div className="gift-grid">{gifts.map(g=><button key={g.name} className="gift-tile" onClick={() => sendGift(g)}><span>{g.emoji}</span><b>{g.name}</b><small><Coins size={13}/>{g.coins}</small></button>)}</div><div className="coin-balance"><Coins size={17}/> Balance <b>{coins.toLocaleString()} coins</b></div><small className="modal-footnote">Demo wallet only. Purchases and real-money transactions are not enabled.</small></div></div>}

{activePremiumGift && (
  <div
    className="premium-gift-overlay"
    key={activePremiumGift.id}
  >
    <div className="premium-gift-content">
      <div className="premium-gift-sparkles">✦ ✧ ✦</div>
      <div className="premium-gift-emoji">
        {activePremiumGift.emoji}
      </div>
      <h1>{activePremiumGift.name}</h1>
      <p>
        {activePremiumGift.sender} sent {activePremiumGift.name} to {activePremiumGift.recipient || 'the room'}!
      </p>
      <div className="premium-gift-sparkles">✧ ✦ ✧</div>
    </div>
  </div>
)}

{showProfile && (
  <div className="modal-backdrop" onClick={() => setShowProfile(false)}>
    <div className="modal profile-modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setShowProfile(false)}>
        <X size={18}/>
      </button>

      {profilePhoto ? (
        <img
          src={profilePhoto}
          alt="Profile"
          className="avatar avatar-profile"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <span className="avatar avatar-profile avatar-you">
          {(displayName.trim()[0] || 'Y').toUpperCase()}
        </span>
      )}

      <h2>Your NOSHERS profile</h2>
      <p>Choose your name and profile photo.</p>

      <div className="profile-info">
        <label>
          Display name
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            maxLength={30}
          />
        </label>

        <label>
          Profile photo
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;

              if (file.size > 1024 * 1024) {
                notify('Choose a photo smaller than 1 MB.');
                e.target.value = '';
                return;
              }

             
const reader = new FileReader();

reader.onload = () => {
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    const maxSize = 400;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));

    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext('2d');
    if (!context) {
      notify('Could not process this photo.');
      return;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    setProfilePhoto(canvas.toDataURL('image/jpeg', 0.65));
  };

  image.onerror = () => notify('Could not read this photo.');
  image.src = reader.result;
};

reader.readAsDataURL(file);

            }}
          />
        </label>

        <div>
          <span>Membership</span>
          <b>Free member</b>
        </div>

        <div>
          <span>Coin balance</span>
          <b>{coins.toLocaleString()} coins</b>
        </div>
      </div>

      <button
        className="primary-btn full"
        onClick={() => {
          const name = displayName.trim();

          if (!name) {
            notify('Please enter your display name.');
            return;
          }

          try {
            localStorage.setItem('noshers-display-name', name);
            if (profilePhoto) {
              localStorage.setItem('noshers-profile-photo', profilePhoto);
            } else {
              localStorage.removeItem('noshers-profile-photo');
            }

            setDisplayName(name);
            setShowProfile(false);
            notify('Profile saved successfully!');
          } catch {
            notify('Photo could not be saved. Choose a smaller image.');
          }
        }}
      >
        <Camera size={17}/> Save profile
      </button>
    </div>
  </div>
)}

      {toast && <div className="toast"><Sparkles size={16}/>{toast}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
