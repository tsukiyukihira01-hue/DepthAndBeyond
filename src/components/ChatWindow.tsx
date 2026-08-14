import React, { useState, useEffect, useRef } from 'react';
import { Character, ChatMessage } from '../types/game';
import { MessageSquare, Send, Shield, Lock, Bell, Users, Megaphone, Minus, Maximize2 } from 'lucide-react';

interface ChatWindowProps {
  character: Character | null;
  onSelectPlayer: (playerName: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ character, onSelectPlayer }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeChannel, setActiveChannel] = useState<ChatMessage['channel']>('all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [chatError, setChatError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic available channel tabs based on character status
  const availableChannels: { id: ChatMessage['channel']; name: string }[] = [
    { id: 'all', name: 'All' },
    { id: 'global', name: 'Global' },
    { id: 'trade', name: 'Trade' },
    { id: 'recruit', name: 'Recruit' },
  ];

  if (character?.guildId) {
    availableChannels.push({ id: 'guild', name: 'Guild' });
  }

  if (character?.partyId) {
    availableChannels.push({ id: 'party', name: 'Party' });
  }

  availableChannels.push({ id: 'announcement', name: 'Announcements' });

  // Auto-switch away from Guild or Party channel if character leaves guild or party
  useEffect(() => {
    if (activeChannel === 'guild' && !character?.guildId) {
      setActiveChannel('all');
    }
    if (activeChannel === 'party' && !character?.partyId) {
      setActiveChannel('all');
    }
  }, [character?.guildId, character?.partyId, activeChannel]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Fetch Chat Messages
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await fetch('/api/chat/messages');
        const data = await res.json();
        if (data.messages) {
          if (!isExpanded && data.messages.length > messages.length && messages.length > 0) {
            setUnreadCount((prev) => prev + (data.messages.length - messages.length));
          }
          setMessages(data.messages);
        }
      } catch {
        // Silently handle chat fetch
      }
    };

    fetchChat();
    const timer = setInterval(fetchChat, 2500);
    return () => clearInterval(timer);
  }, [isExpanded, messages.length]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => setCooldownSeconds((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownSeconds]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || !inputContent.trim() || cooldownSeconds > 0) return;
    setChatError(null);

    // If typing in 'all', send as 'global'
    const targetChannel = activeChannel === 'all' ? 'global' : activeChannel;

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          channel: targetChannel,
          content: inputContent,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setChatError(data.error || 'Failed to send chat message.');
      } else if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputContent('');
        setCooldownSeconds(5); // 5s chat cooldown
      }
    } catch {
      setChatError('Network error while sending message.');
    }
  };

  const filteredMessages = messages.filter((m) => {
    // Hide messages from muted players
    if (character?.mutedPlayerIds?.includes(m.senderId)) {
      return false;
    }

    // If 'all', include messages from all channels, but hide guild/party messages from non-members
    if (activeChannel === 'all') {
      if (m.channel === 'guild') {
        return Boolean(character?.guildId && (!m.guildId || m.guildId === character.guildId));
      }
      if (m.channel === 'party') {
        return Boolean(character?.partyId && (!m.partyId || m.partyId === character.partyId));
      }
      return true;
    }

    // Global channel filters strictly for global messages
    if (activeChannel === 'global') {
      return m.channel === 'global';
    }

    if (activeChannel === 'guild') {
      return m.channel === 'guild' && Boolean(character?.guildId && (!m.guildId || m.guildId === character.guildId));
    }

    if (activeChannel === 'party') {
      return m.channel === 'party' && Boolean(character?.partyId && (!m.partyId || m.partyId === character.partyId));
    }

    if (activeChannel === 'announcement') {
      return m.channel === 'announcement' || m.channel === 'announcements';
    }

    return m.channel === activeChannel;
  });

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none">
      {!isExpanded ? (
        /* Floating Minimized Pill Trigger */
        <button
          onClick={() => {
            setIsExpanded(true);
            setUnreadCount(0);
          }}
          className="relative flex items-center gap-2 rounded-full border border-amber-500/40 bg-slate-950/95 px-4 py-2.5 text-xs font-bold text-amber-200 shadow-2xl backdrop-blur-md hover:bg-slate-900 transition-all transform hover:scale-105 cursor-pointer"
        >
          <div className="relative">
            <MessageSquare className="h-4 w-4 text-amber-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span>Realm Chat Network</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-950">
              +{unreadCount}
            </span>
          )}
        </button>
      ) : (
        /* Floating Expanded Chat Popup Window */
        <div className="flex flex-col h-[28rem] w-80 sm:w-96 rounded-2xl border border-amber-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              <span className="font-serif text-xs font-bold text-amber-200">
                Realm Chat Network
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              title="Minimize Chat"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          {/* Channel Bar */}
          <div className="flex items-center gap-1 overflow-x-auto py-1.5 border-b border-slate-800/80 text-[10px] font-bold">
            {availableChannels.map(({ id, name }) => (
              <button
                key={id}
                onClick={() => setActiveChannel(id)}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeChannel === id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/80'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto my-2 space-y-2 p-1 text-xs font-sans">
            <div className="text-[10px] text-slate-500 text-center py-1 border-b border-slate-900 font-mono">
              📜 #{activeChannel.toUpperCase()} Channel • Public & Private Network
            </div>
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="leading-relaxed bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 flex-wrap">
                  {msg.senderAvatarUrl && (
                    <img src={msg.senderAvatarUrl} alt="" className="h-4 w-4 rounded-full object-cover border border-amber-500/40 shrink-0" />
                  )}
                  <span className="font-mono text-slate-500">[{msg.timestamp}]</span>
                  
                  {/* Channel indicator badge in All view */}
                  {activeChannel === 'all' && (
                    <span className="rounded bg-slate-800 px-1 py-0.1 text-[9px] font-semibold text-amber-300/90 uppercase">
                      [{msg.channel}]
                    </span>
                  )}

                  {msg.senderRole === 'ADMIN' && (
                    <span className="rounded bg-amber-500 px-1 py-0.1 text-[9px] font-extrabold text-slate-950">
                      [GM]
                    </span>
                  )}
                  {msg.senderRole === 'MOD' && (
                    <span className="rounded bg-purple-600 px-1 py-0.1 text-[9px] font-extrabold text-slate-100">
                      [MOD]
                    </span>
                  )}
                  {msg.senderGuildTag && (
                    <span className="text-amber-400 font-bold">[{msg.senderGuildTag}]</span>
                  )}
                  <button
                    onClick={() => onSelectPlayer(msg.senderName)}
                    className="font-bold text-amber-200 hover:underline cursor-pointer"
                  >
                    {msg.senderName}
                  </button>
                </div>
                <div className="text-slate-200 pl-1 text-[11px]" dangerouslySetInnerHTML={{ __html: msg.content }} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {chatError && (
            <div className="rounded-lg bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 text-[10px] font-semibold text-rose-200 flex items-center justify-between my-1">
              <span>⚠️ {chatError}</span>
              <button onClick={() => setChatError(null)} className="text-slate-400 hover:text-white font-bold ml-2">×</button>
            </div>
          )}

          {/* Input Bar */}
          {(() => {
            const isGmOrAdmin = Boolean(
              character?.title === 'Game Master' ||
                character?.title === 'Admin' ||
                character?.title === 'Realm GM'
            );
            const isAnnouncementDisabled = activeChannel === 'announcement' && !isGmOrAdmin;
            const isGuildDisabled = activeChannel === 'guild' && !character?.guildId;
            const isPartyDisabled = activeChannel === 'party' && !character?.partyId;
            const isGlobalLevelRestricted = (activeChannel === 'global' || activeChannel === 'all') && character && character.level < 10;

            const isDisabled = !character || isAnnouncementDisabled || isGuildDisabled || isPartyDisabled || Boolean(isGlobalLevelRestricted);

            return (
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={inputContent}
                  disabled={isDisabled}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={
                    !character
                      ? 'Log in to chat...'
                      : isAnnouncementDisabled
                      ? '🔒 Read-only channel (GM broadcasts)'
                      : isGuildDisabled
                      ? '🔒 Join a Guild to chat...'
                      : isPartyDisabled
                      ? '🔒 Join a Party to chat...'
                      : isGlobalLevelRestricted
                      ? 'Reach Lv 10 for Global Chat...'
                      : cooldownSeconds > 0
                      ? `Wait ${cooldownSeconds}s...`
                      : activeChannel === 'all'
                      ? 'Type message in #all (posts to global)...'
                      : `Type in #${activeChannel}...`
                  }
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isDisabled || !inputContent.trim() || cooldownSeconds > 0}
                  className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            );
          })()}
        </div>
      )}
    </div>
  );
};
