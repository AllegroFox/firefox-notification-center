/* =========================================================
   State + mock data
   ========================================================= */

const NOW = new Date('2026-06-04T09:42:00');
const minsAgo = (n) => new Date(NOW.getTime() - n*60*1000);

const PROFILES = {
  personal: {
    id: 'personal',
    name: 'Personal',
    email: 'msyed@gmail.com',
    avatar: 'M',
    color: 'linear-gradient(135deg, #FF7139 0%, #FF4F8B 100%)',
    accent: '#FF7139',
  },
  work: {
    id: 'work',
    name: 'Work',
    email: 'msyed@mozilla.com',
    avatar: 'M',
    color: 'linear-gradient(135deg, #7B5CF0 0%, #00B3C7 100%)',
    accent: '#7B5CF0',
  },
};
let currentProfile = 'personal';

window.SOURCES = [
  // ===== Personal sources =====
  { id: 'nyt',     profile: 'personal', name: 'The New York Times',     host: 'nytimes.com',         color: '#000000', icon: 'N', weekly: 18, opened: 6,  status: 'healthy' },
  { id: 'slack-p', profile: 'personal', name: 'Slack — Indie Hackers',  host: 'indiehackers.slack.com', color: '#4A154B', icon: 'S', weekly: 5,  opened: 4,  status: 'healthy' },
  { id: 'gh-p',    profile: 'personal', name: 'GitHub — Personal',      host: 'github.com',          color: '#24292F', icon: 'G', weekly: 3,  opened: 3,  status: 'healthy' },
  { id: 'amazon',  profile: 'personal', name: 'Amazon',                 host: 'amazon.com',          color: '#FF9900', icon: 'A', weekly: 7,  opened: 1,  status: 'dormant' },
  { id: 'reddit',  profile: 'personal', name: 'Reddit',                 host: 'reddit.com',          color: '#FF4500', icon: 'R', weekly: 11, opened: 0,  status: 'dormant' },
  { id: 'shopify', profile: 'personal', name: 'ShopDeals.io',           host: 'shopdeals.io',        color: '#7B5CF0', icon: 'D', weekly: 10, opened: 0,  status: 'dormant' },
  { id: 'discord', profile: 'personal', name: 'Discord',                host: 'discord.com',         color: '#5865F2', icon: 'D', weekly: 14, opened: 5,  status: 'healthy' },
  { id: 'spotify', profile: 'personal', name: 'Spotify',                host: 'spotify.com',         color: '#1ED760', icon: 'S', weekly: 2,  opened: 2,  status: 'healthy' },

  // ===== Work sources =====
  { id: 'slack-w', profile: 'work',     name: 'Slack — Mozilla',        host: 'mozilla.slack.com',   color: '#4A154B', icon: 'S', weekly: 26, opened: 22, status: 'healthy' },
  { id: 'gh-w',    profile: 'work',     name: 'GitHub — Mozilla',       host: 'github.com',          color: '#24292F', icon: 'G', weekly: 18, opened: 15, status: 'healthy' },
  { id: 'linear',  profile: 'work',     name: 'Linear',                 host: 'linear.app',          color: '#5E6AD2', icon: 'L', weekly: 9,  opened: 8,  status: 'healthy' },
  { id: 'gcal',    profile: 'work',     name: 'Google Calendar',        host: 'calendar.google.com', color: '#4285F4', icon: 'C', weekly: 12, opened: 12, status: 'healthy' },
  { id: 'figma',   profile: 'work',     name: 'Figma',                  host: 'figma.com',           color: '#F24E1E', icon: 'F', weekly: 4,  opened: 1,  status: 'dormant' },
  { id: 'gmail-w', profile: 'work',     name: 'Gmail — Work',           host: 'mail.google.com',     color: '#EA4335', icon: 'G', weekly: 22, opened: 9,  status: 'healthy' },
];

window.NOTIFS = [
  // ===== Personal notifications =====
  { id: 1,  src: 'nyt',     when: minsAgo(8),   unread: true, isNew: true, title: 'Breaking: Senate passes infrastructure bill', preview: 'The vote was 67-32 after a marathon overnight session that included multiple amendments.' },
  { id: 2,  src: 'slack-p', when: minsAgo(36),  unread: true,              title: '2 new messages in #side-projects', preview: 'Marie: "Anyone else seeing this issue with the Stripe webhook?"' },
  { id: 3,  src: 'gh-p',    when: minsAgo(95),  unread: true,              title: 'msyed/dotfiles • Pull request', preview: 'Dependabot opened "Bump prettier from 3.2 to 3.3" (#42)' },
  { id: 4,  src: 'amazon',  when: minsAgo(64),  unread: true,              title: 'Your package will arrive today', preview: 'Out for delivery from the Berkeley facility.' },
  { id: 5,  src: 'reddit',  when: minsAgo(92),  unread: true,              title: 'r/firefox: 234 new posts', preview: 'Top: "Anyone else excited about the new tab redesign?"' },
  { id: 6,  src: 'nyt',     when: minsAgo(180), unread: false,             title: 'Your Morning Briefing', preview: 'Five stories the Times is following this morning.' },
  { id: 7,  src: 'shopify', when: minsAgo(220), unread: false,             title: '🔥 FLASH SALE — 60% off ends in 1 hour', preview: "Don't miss out! Limited stock on bestsellers." },
  { id: 8,  src: 'discord', when: minsAgo(45),  unread: true,              title: 'New activity in Indie Game Devs', preview: '12 messages in #weekly-screenshots since you last checked.' },
  { id: 9,  src: 'discord', when: minsAgo(150), unread: false,             title: '@you was mentioned in #general', preview: 'sarah_dev: "Hey @msyed, did you see the new build?"' },
  { id: 10, src: 'spotify', when: minsAgo(420), unread: false,             title: 'Your Discover Weekly is ready', preview: '30 new tracks based on what you\'ve been listening to.' },

  // ===== Work notifications =====
  { id: 20, src: 'slack-w', when: minsAgo(4),   unread: true, isNew: true, title: '3 new messages in #design-systems', preview: 'Carolyn: "Has anyone seen the new Acorn tokens land in main?"' },
  { id: 21, src: 'gh-w',    when: minsAgo(12),  unread: true, isNew: true, title: 'mozilla/firefox • Review requested', preview: '@kathleen requested your review on "Notification widget — a11y audit" (#247)' },
  { id: 22, src: 'gcal',    when: minsAgo(15),  unread: true,              title: 'Design review · in 15 min', preview: 'Notification Center concept review with the New Tab team.' },
  { id: 23, src: 'linear',  when: minsAgo(48),  unread: true,              title: 'NEW-142: Sidebar designs assigned to you', preview: 'Dan moved this to "In Progress" and added you as assignee.' },
  { id: 24, src: 'slack-w', when: minsAgo(72),  unread: true,              title: 'New mention in #firefox-newtab', preview: 'alejandro: "Curious what @msyed thinks about modes here"' },
  { id: 25, src: 'gmail-w', when: minsAgo(102), unread: true,              title: 'Quarterly OKR check-in — please respond', preview: 'From: leadership@mozilla.com — Reply by Friday EOD.' },
  { id: 26, src: 'gcal',    when: minsAgo(190), unread: false,             title: '1:1 with Dan moved to Thursday', preview: 'Recurring meeting moved from Tuesday 2pm to Thursday 2pm.' },
  { id: 27, src: 'figma',   when: minsAgo(280), unread: false,             title: 'Carolyn commented on "Acorn v2 tokens"', preview: '"What if we made the spacing scale geometric?"' },
  { id: 28, src: 'gh-w',    when: minsAgo(345), unread: false,             title: 'CI passed on mozilla/firefox#247', preview: 'All 1,243 checks succeeded · ready to merge.' },
];

const sourceState = Object.fromEntries(SOURCES.map(s => [s.id, { paused: false, revoked: false }]));

function sourcesForProfile(p = currentProfile) {
  return SOURCES.filter(s => s.profile === p);
}
function notifsForProfile(p = currentProfile) {
  const allowed = new Set(sourcesForProfile(p).map(s => s.id));
  return NOTIFS.filter(n => allowed.has(n.src));
}
function profile() { return PROFILES[currentProfile]; }

let bannerTimer = null;
let undoSnapshot = null;
let quietMode = null; // null | "1h" | "today" | "weekend" | "custom"

/* =========================================================
   Helpers
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function src(id) { return SOURCES.find(s => s.id === id); }

function timeAgo(d) {
  const m = Math.round((NOW - d) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + 'h ago';
  const dys = Math.round(h / 24);
  return dys + 'd ago';
}

function dateGroup(d) {
  const diffH = (NOW - d) / 3600000;
  if (diffH < 6) return 'This morning';
  if (diffH < 24) return 'Earlier today';
  return 'Yesterday';
}
