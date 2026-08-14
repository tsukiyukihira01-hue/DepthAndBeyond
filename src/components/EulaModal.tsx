import React, { useState } from 'react';
import { Scroll, ShieldCheck, CheckSquare, Square, X, ShieldAlert, Users, Swords, Coins, MessageSquare, Lock } from 'lucide-react';

interface EulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

type TabType = 'multi_account' | 'fair_play' | 'economy' | 'chat_community' | 'privacy_telemetry';

export const EulaModal: React.FC<EulaModalProps> = ({ isOpen, onClose, onAccept }) => {
  const [activeTab, setActiveTab] = useState<TabType>('multi_account');
  const [multiAccountChecked, setMultiAccountChecked] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  if (!isOpen) return null;

  const allChecked = multiAccountChecked && tosChecked && privacyChecked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-3xl rounded-2xl border border-amber-500/30 bg-slate-950/95 p-4 sm:p-6 text-slate-100 shadow-2xl shadow-amber-950/50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Scroll className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-amber-200">
                  Realm Laws, Terms & Fair Play EULA
                </h2>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 border border-rose-500/30 hidden sm:inline">
                  Strict 1-Account Enforced
                </span>
              </div>
              <p className="text-xs text-slate-400">Depth and Beyond — Official Rules of Conduct & User Agreement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Category Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 py-2 my-2 overflow-x-auto shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('multi_account')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'multi_account'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-rose-400" />
            <span>1-Account Rule</span>
          </button>

          <button
            onClick={() => setActiveTab('fair_play')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'fair_play'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Swords className="h-3.5 w-3.5 text-amber-400" />
            <span>Gameplay & Bots</span>
          </button>

          <button
            onClick={() => setActiveTab('economy')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'economy'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Coins className="h-3.5 w-3.5 text-emerald-400" />
            <span>Economy & RMT</span>
          </button>

          <button
            onClick={() => setActiveTab('chat_community')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'chat_community'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-500/50 shadow-md shadow-sky-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
            <span>Chat & Community</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy_telemetry')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy_telemetry'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Lock className="h-3.5 w-3.5 text-purple-400" />
            <span>Telemetry & Privacy</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="my-2 flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs leading-relaxed text-slate-300 space-y-3 font-sans">
          {activeTab === 'multi_account' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm border-b border-rose-500/20 pb-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span>Strict One Account Per Player Rule (Zero Multi-Account Tolerance)</span>
              </div>
              <p>
                <strong className="text-slate-100">1.1 Single Account Mandate:</strong> Every physical individual is granted permission to register, own, and operate strictly <strong className="text-amber-300">ONE (1) game account</strong> in Depth and Beyond. Operating multiple accounts (commonly referred to as "alts", "mules", "storage accounts", "trade proxies", or "bot alt farms") is strictly prohibited under all circumstances.
              </p>
              <p>
                <strong className="text-slate-100">1.2 Prohibited Funneling & Alt Trading:</strong> Transferring gold, equipment, crafting materials, gems, or familiars between accounts controlled by the same person or household group to gain an unfair progression advantage is classified as illegal account funneling.
              </p>
              <p>
                <strong className="text-slate-100">1.3 Automated Multi-Account Detection:</strong> Server telemetry dynamically monitors account creation footprints, IP ranges, hardware signatures, and trade topology. Any detected multi-accounting network will trigger immediate, automated, and permanent bans across <strong className="text-rose-400">ALL associated accounts</strong> without prior warning or appeal.
              </p>
              <p>
                <strong className="text-slate-100">1.4 Account Sharing & Renting:</strong> Lending, renting, selling, or sharing account login credentials with third parties or guildmates is prohibited. You are fully responsible for all actions occurring on your registered account.
              </p>
            </div>
          )}

          {activeTab === 'fair_play' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm border-b border-amber-500/20 pb-1.5">
                <Swords className="h-4 w-4 text-amber-400" />
                <span>Fair Play, Gameplay Integrity & Automation Policy</span>
              </div>
              <p>
                <strong className="text-slate-100">2.1 Authorized In-Game AFK Systems:</strong> Depth and Beyond provides built-in <strong className="text-amber-300">Auto-Battle</strong> and <strong className="text-amber-300">AFK Grinding</strong> features within the dungeon and raid interfaces. Using these official in-game features is fully authorized and encouraged.
              </p>
              <p>
                <strong className="text-slate-100">2.2 Illegal External Tools & Macros:</strong> The use of third-party macro software, auto-clickers, packet injection utilities, client-side memory editors, speed hacks, or automated browser scripts is strictly illegal.
              </p>
              <p>
                <strong className="text-slate-100">2.3 Combat Lock & State Integrity:</strong> Intentionally closing the browser, severing network connection, or manipulating DOM elements mid-combat to evade character death, dungeon failure penalties, or raid boss wipe mechanics is strictly prohibited. Combat state is authoritative on the server.
              </p>
              <p>
                <strong className="text-slate-100">2.4 Exploit & Bug Abuse:</strong> Uncovering an unintended game bug (e.g., item duplication glitches, skill tree respec fee bypasses, gold calculation errors) must be immediately reported to Game Master [GM] staff. Exploiting bugs for personal gain or distributing exploit instructions to other players will result in immediate account termination.
              </p>
            </div>
          )}

          {activeTab === 'economy' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm border-b border-emerald-500/20 pb-1.5">
                <Coins className="h-4 w-4 text-emerald-400" />
                <span>Virtual Economy, Marketplace & Real-Money Trading (RMT)</span>
              </div>
              <p>
                <strong className="text-slate-100">3.1 Ownership of Virtual Assets:</strong> All characters, items, gold, equipment, familiars, skill nodes, and virtual currencies created or acquired within Depth and Beyond remain the exclusive virtual property of the game platform.
              </p>
              <p>
                <strong className="text-slate-100">3.2 Zero-Tolerance RMT Prohibition:</strong> Buying, selling, or trading game accounts, gold, items, or services for real-world currency, fiat money, cryptocurrency, gift cards, or external goods is strictly illegal. Players engaging in RMT transactions will face immediate permanent account bans.
              </p>
              <p>
                <strong className="text-slate-100">3.3 Marketplace & Direct Trade Audits:</strong> All peer-to-peer trades, marketplace listings, and high-value gold transactions are logged in real-time. System audit algorithms analyze transaction valuations to prevent market manipulation, gold washing, and fraudulent transfers.
              </p>
            </div>
          )}

          {activeTab === 'chat_community' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-sm border-b border-sky-500/20 pb-1.5">
                <MessageSquare className="h-4 w-4 text-sky-400" />
                <span>Community Code of Conduct & Chat Enforcement</span>
              </div>
              <p>
                <strong className="text-slate-100">4.1 Respectful Communication:</strong> Harassment, hate speech, discrimination, excessive profanity, toxic personal attacks, dox threats, and spamming in Global, Guild, or Party chat channels are strictly prohibited.
              </p>
              <p>
                <strong className="text-slate-100">4.2 Scamming & Phishing:</strong> Attempting to deceive other players out of items or gold, promoting phishing URLs, or distributing malicious links will result in permanent chat and account bans.
              </p>
              <p>
                <strong className="text-slate-100">4.3 Staff Impersonation:</strong> Falsely claiming to be a Game Master [GM], Moderator [MOD], or developer staff member is strictly illegal and subject to an immediate lifetime ban.
              </p>
              <p>
                <strong className="text-slate-100">4.4 Moderation Sanctions:</strong> Appointed GMs and MODs possess authoritative rights to issue temporary chat mutes, 120-minute realm suspensions, or permanent bans for severe code violations.
              </p>
            </div>
          )}

          {activeTab === 'privacy_telemetry' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm border-b border-purple-500/20 pb-1.5">
                <Lock className="h-4 w-4 text-purple-400" />
                <span>Security Telemetry & Privacy Data Policy</span>
              </div>
              <p>
                <strong className="text-slate-100">5.1 Collected Telemetry Data:</strong> To guarantee fair play, prevent automated multi-account farms, and secure account authentication, we record browser environment signatures, device parameters, IP address ranges, and login timestamps.
              </p>
              <p>
                <strong className="text-slate-100">5.2 Data Usage & Protection:</strong> Collected telemetry data is used exclusively for internal security auditing, cheat detection, and server performance optimization. We never sell, lease, or share player security data with third-party advertisers.
              </p>
              <p>
                <strong className="text-slate-100">5.3 Game Master Audit Logs:</strong> High-value transactions, gold respec payments, skill tree allocations, and combat results are stored in secure server audit logs to verify economy balance and prevent state manipulation.
              </p>
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="space-y-2 py-2 text-xs border-t border-slate-800 pt-3 shrink-0">
          <button
            onClick={() => setMultiAccountChecked(!multiAccountChecked)}
            className="flex items-center gap-2.5 text-slate-300 hover:text-amber-300 transition-colors text-left cursor-pointer"
          >
            {multiAccountChecked ? (
              <CheckSquare className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-slate-500 shrink-0" />
            )}
            <span className="font-semibold text-rose-200">
              I strictly agree to the One Account Per Player Policy (No Alts, Mules, or Bot Alt Farms).
            </span>
          </button>

          <button
            onClick={() => setTosChecked(!tosChecked)}
            className="flex items-center gap-2.5 text-slate-300 hover:text-amber-300 transition-colors text-left cursor-pointer"
          >
            {tosChecked ? (
              <CheckSquare className="h-4 w-4 text-amber-400 shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-slate-500 shrink-0" />
            )}
            <span>I accept the Terms of Service, Gameplay Rules, and Economy Policies.</span>
          </button>

          <button
            onClick={() => setPrivacyChecked(!privacyChecked)}
            className="flex items-center gap-2.5 text-slate-300 hover:text-amber-300 transition-colors text-left cursor-pointer"
          >
            {privacyChecked ? (
              <CheckSquare className="h-4 w-4 text-purple-400 shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-slate-500 shrink-0" />
            )}
            <span>I acknowledge the Security Telemetry & Anti-Cheat Privacy Policy.</span>
          </button>
        </div>

        {/* Footer Action */}
        <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Strict Fair Play Protocol v2.5
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
            >
              Decline
            </button>
            <button
              disabled={!allChecked}
              onClick={() => {
                if (allChecked) onAccept();
              }}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-md ${
                allChecked
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

