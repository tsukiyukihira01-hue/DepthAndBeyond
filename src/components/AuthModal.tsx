import React, { useState } from 'react';
import { UserAccount, Character, Faction } from '../types/game';
import { Shield, KeyRound, User, Sparkles, Check, ChevronRight } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { setAuthCookie } from '../utils/cookie';
import {
  CHARACTER_CLASSES,
  ARCHETYPES,
  getClassDefinition,
  getArchetypeDefinition,
  calculateStartingStats,
} from '../data/classesAndArchetypes';
import { CharacterType } from '../types/classes';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, token: string, characters: Character[]) => void;
  onCharacterSelect: (character: Character) => void;
  openEulaModal: () => void;
  isEulaAccepted: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onCharacterSelect,
  openEulaModal,
  isEulaAccepted,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'character_select' | 'create_character'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User state after login
  const [loggedInUser, setLoggedInUser] = useState<UserAccount | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Character Creation fields
  const [charName, setCharName] = useState('');
  const [faction, setFaction] = useState<Faction>('HEAVENLY');
  const [selectedClass, setSelectedClass] = useState<string>('heavy_knight');
  const [selectedArchetype, setSelectedArchetype] = useState<string>('tactical_commander');
  const [typeFilter, setTypeFilter] = useState<'all' | CharacterType>('all');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/google-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          googleUser: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Server-side Google OAuth token verification failed.');
        return;
      }

      setLoggedInUser(data.user);
      const fetchedChars = data.characters || (data.character ? [data.character] : []);
      setCharacters(fetchedChars);
      if (data.token) {
        setAuthCookie(data.token, rememberMe);
      }
      onLoginSuccess(data.user, data.token, fetchedChars);

      if (fetchedChars.length === 1) {
        onCharacterSelect(fetchedChars[0]);
        onClose();
      } else if (fetchedChars.length > 1) {
        setMode('character_select');
      } else {
        setMode('create_character');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.message?.includes('cancelled-popup-request') ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      setError(err?.message || 'Google Sign-In failed.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          setError('2FA Code required for Admin / Security account. Please enter your 6-digit verification code.');
          return;
        }
        setError(data.error || 'Login failed.');
        return;
      }

      const fetchedChars = data.characters || [];
      setLoggedInUser(data.user);
      setCharacters(fetchedChars);
      if (data.token) {
        setAuthCookie(data.token, rememberMe);
      }
      onLoginSuccess(data.user, data.token, fetchedChars);

      if (fetchedChars.length === 1) {
        onCharacterSelect(fetchedChars[0]);
        onClose();
      } else if (fetchedChars.length > 1) {
        setMode('character_select');
      } else {
        setMode('create_character');
      }
    } catch {
      setError('Connection error to game server.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEulaAccepted) {
      setError('You must accept the EULA and Terms of Service before registering.');
      openEulaModal();
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, acceptTerms: true }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      setLoggedInUser(data.user);
      setCharacters([]);
      if (data.token) {
        setAuthCookie(data.token, rememberMe);
      }
      onLoginSuccess(data.user, data.token, []);
      setMode('create_character');
    } catch {
      setError('Connection error during registration.');
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !charName) return;

    if (charName.trim().length < 2 || charName.trim().length > 20) {
      setError('Character name must be between 2 and 20 characters in length.');
      return;
    }

    try {
      const res = await fetch('/api/character/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: loggedInUser.id,
          name: charName,
          faction,
          characterClass: selectedClass,
          archetype: selectedArchetype,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create character.');
        return;
      }

      const updated = [...characters, data.character];
      setCharacters(updated);
      onCharacterSelect(data.character);
      onClose();
    } catch {
      setError('Error communicating with character service.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className={`relative w-full max-w-md ${mode === 'create_character' ? 'sm:max-w-3xl' : ''} rounded-2xl border border-amber-500/30 bg-slate-950/95 p-6 text-slate-100 shadow-2xl shadow-amber-950/50 transition-all duration-200 max-h-[90vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100"
        >
          ✕
        </button>

        {/* Header Branding */}
        <div className="text-center pb-4 border-b border-slate-800">
          <h2 className="font-serif text-2xl font-bold tracking-wider text-amber-200">
            DEPTH AND BEYOND
          </h2>
          <p className="text-xs text-slate-400">Medieval Dreamy Fantasy MMORPG</p>
        </div>

        {error && (
          <div className="my-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5 text-center text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Mode 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Email Address or User ID</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <span>Remember Me (Keep session in cookies)</span>
              </label>
            </div>

            {requires2FA && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" /> 2FA Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setTwoFactorCode('123456')}
                    className="text-[10px] text-amber-400 underline hover:text-amber-200 cursor-pointer"
                  >
                    Auto-Fill (123456)
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border border-amber-500/50 bg-slate-900 px-3 py-2 text-xs text-center font-mono tracking-widest text-amber-200 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Log In to World
            </button>

            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
              <span className="relative bg-slate-950 px-2 text-[10px] text-slate-500 uppercase font-mono">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-amber-400 hover:underline"
              >
                New Adventurer? Register Here
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* EULA Opt-In Trigger */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Terms & EULA Agreement</span>
                <button
                  type="button"
                  onClick={openEulaModal}
                  className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
                >
                  {isEulaAccepted ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Accepted
                    </span>
                  ) : (
                    'Read & Opt-In'
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Create Account
            </button>

            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
              <span className="relative bg-slate-950 px-2 text-[10px] text-slate-500 uppercase font-mono">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign up with Google
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-amber-400 hover:underline"
              >
                Already have an account? Log In
              </button>
            </div>
          </form>
        )}

        {/* Mode 3: CHARACTER SELECT */}
        {mode === 'character_select' && (
          <div className="mt-4 space-y-3">
            <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider text-center">
              Select Character Slot ({characters.length}/2)
            </h3>

            <div className="space-y-2">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => {
                    onCharacterSelect(char);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-left hover:border-amber-500/50 hover:bg-slate-800/80 transition-all cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-amber-400" /> {char.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Lv {char.level} • {char.faction} Faction • {char.gold} Gold
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              ))}
            </div>

            {characters.length < 2 && (
              <button
                onClick={() => setMode('create_character')}
                className="w-full rounded-xl border border-dashed border-amber-500/40 bg-amber-950/10 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-400" /> Create New Character
              </button>
            )}
          </div>
        )}

        {/* Mode 4: CREATE CHARACTER */}
        {mode === 'create_character' && (() => {
          const classDef = getClassDefinition(selectedClass);
          const archDef = getArchetypeDefinition(selectedArchetype);
          const computedStats = calculateStartingStats(selectedClass, selectedArchetype);

          const filteredClasses = CHARACTER_CLASSES.filter(
            (c) => typeFilter === 'all' || c.characterType === typeFilter
          );

          return (
            <form onSubmit={handleCreateCharacter} className="mt-4 space-y-4 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300 block">Character Name</label>
                    <span className="text-[10px] text-amber-400 font-mono">2-20 chars</span>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={20}
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    placeholder="e.g. Frieren, Himmel, Heavy Knight"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cosmetic Faction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFaction('HEAVENLY')}
                      className={`rounded-xl border p-2 text-xs text-center transition-all cursor-pointer ${
                        faction === 'HEAVENLY'
                          ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      ✨ Heavenly Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setFaction('UNDERWORLD')}
                      className={`rounded-xl border p-2 text-xs text-center transition-all cursor-pointer ${
                        faction === 'UNDERWORLD'
                          ? 'border-purple-400 bg-purple-950/40 text-purple-200 font-bold'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      🌌 Underworld Realm
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. Class Selection & 4 Main Character Types */}
              <div>
                <div className="flex flex-wrap items-center justify-between mb-1.5 gap-1">
                  <label className="text-xs font-bold text-amber-300 block">
                    1. Choose Character Class & Archetype Type
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">
                    4 Main Types: Physical • Magical • Defensive • Support
                  </span>
                </div>

                {/* Character Type Category Filter Buttons */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                  {[
                    { key: 'all', label: 'All Classes' },
                    { key: 'physical', label: '⚔️ Physical' },
                    { key: 'magical', label: '🔮 Magical' },
                    { key: 'defensive', label: '🛡️ Defensive' },
                    { key: 'support', label: '🕊️ Support' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTypeFilter(key as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        typeFilter === key
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredClasses.map((cls) => {
                    const isSelected = selectedClass === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClass(cls.id)}
                        className={`rounded-xl border p-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-400 bg-gradient-to-b from-amber-500/20 to-amber-950/40 shadow-md ring-1 ring-amber-400/50'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${cls.typeBadgeColor}`}>
                              {cls.characterType}
                            </span>
                            <span className="text-[9px] font-mono text-amber-300/80">
                              {cls.primaryStat.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-amber-200 text-xs">
                            <span className="text-base">{cls.icon}</span>
                            <span className="truncate">{cls.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                            {cls.roleTitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Archetype Selection */}
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1.5 flex items-center justify-between">
                  <span>2. Choose Archetype Sub-Trait</span>
                  <span className="text-[10px] text-slate-400 font-normal">Modifies attribute specialization</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ARCHETYPES.map((arch) => {
                    const isSelected = selectedArchetype === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => setSelectedArchetype(arch.id)}
                        className={`rounded-xl border p-2 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-purple-400 bg-gradient-to-r from-purple-500/20 to-purple-950/40 shadow-md ring-1 ring-purple-400/50'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="text-xl p-1 rounded-lg bg-slate-800/80 shrink-0">{arch.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-purple-200 text-xs flex items-center justify-between">
                            <span className="truncate">{arch.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{arch.description}</p>
                          <p className="text-[9px] font-mono text-purple-300 font-medium mt-0.5">{arch.perksSummary}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Live Stats & Starter Gear Preview */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                  <span className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Starting Attributes & Starter Gear
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">
                    {classDef.name} • {archDef.name}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-[10px]">
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                    <span className="text-rose-400 block font-bold">HP</span>
                    <span className="font-mono text-slate-100 font-bold">{computedStats.maxHp}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                    <span className="text-cyan-400 block font-bold">MANA</span>
                    <span className="font-mono text-slate-100 font-bold">{computedStats.maxMana}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                    <span className="text-amber-400 block font-bold">STR</span>
                    <span className="font-mono text-slate-100 font-bold">{computedStats.str}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                    <span className="text-purple-400 block font-bold">INT</span>
                    <span className="font-mono text-slate-100 font-bold">{computedStats.int}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                    <span className="text-blue-400 block font-bold">DEF</span>
                    <span className="font-mono text-slate-100 font-bold">{computedStats.def}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                    <span className="text-emerald-400 block font-bold">WIS</span>
                    <span className="font-mono text-slate-100 font-bold">{computedStats.wis}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                    <span className="text-yellow-400 block font-bold">SPD</span>
                    <span className="font-mono text-slate-100 font-bold">{computedStats.spd}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                    <span className="text-orange-400 block font-bold">DEX</span>
                    <span className="font-mono text-slate-100 font-bold">{computedStats.dex}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-amber-500/10">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-200">
                    <span>{classDef.starterWeaponIcon}</span> Starter Weapon: {classDef.starterWeaponName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    +5 Unassigned Bonus Points
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                Begin Journey as {classDef.name} ({archDef.name})
              </button>
            </form>
          );
        })()}
      </div>
    </div>
  );
};
