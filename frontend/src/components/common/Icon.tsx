import React from 'react';
import { MorphIcon } from 'morphicons/react';
import type { IconNode } from 'morphicons';
import {
  Home,
  Compass,
  TrendingUp,
  Activity,
  Search,
  Bell,
  BellOff,
  Bookmark,
  BookmarkCheck,
  User,
  Users,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Code,
  Code2,
  MessageSquare,
  MessageCircle,
  Heart,
  Star,
  GitFork,
  GitBranch,
  Share2,
  Check,
  CheckCheck,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Plus,
  Edit,
  Edit2,
  Edit3,
  Trash,
  Trash2,
  Download,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  Mail,
  ArrowRight,
  ExternalLink,
  Menu,
  X,
  Cpu,
  BarChart,
  BarChart2,
  FileText,
  FileSearch,
  Eye,
  EyeOff,
  LogOut,
  Layers,
  ChevronDown,
  ChevronRight,
  Send,
  Flag,
  Award,
  Sparkles,
  Terminal,
  Database,
  Boxes,
  Network,
  Ban,
  Play,
  Pin,
  HelpCircle,
  Info,
  AtSign,
  Server,
  Reply,
  Copy
} from 'lucide';

// Official GitHub SVG on 24x24 grid for Morphicons compatibility
const GithubIconNode: any = [
  ['path', { d: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' }]
];

export const ICON_MAP: Record<string, any> = {
  // Common navigation & basic actions
  home: Home,
  Home: Home,
  compass: Compass,
  Compass: Compass,
  trending: TrendingUp,
  TrendingUp: TrendingUp,
  radar: Activity,
  activity: Activity,
  Activity: Activity,
  search: Search,
  Search: Search,
  bell: Bell,
  Bell: Bell,
  bellOff: BellOff,
  BellOff: BellOff,
  bookmark: Bookmark,
  Bookmark: Bookmark,
  bookmarkCheck: BookmarkCheck,
  BookmarkCheck: BookmarkCheck,
  user: User,
  User: User,
  users: Users,
  Users: Users,
  settings: Settings,
  Settings: Settings,
  shield: Shield,
  Shield: Shield,
  shieldAlert: ShieldAlert,
  ShieldAlert: ShieldAlert,
  shieldCheck: ShieldCheck,
  ShieldCheck: ShieldCheck,
  code: Code,
  Code: Code,
  code2: Code2,
  Code2: Code2,
  message: MessageSquare,
  messageSquare: MessageSquare,
  MessageSquare: MessageSquare,
  messageCircle: MessageCircle,
  MessageCircle: MessageCircle,
  heart: Heart,
  Heart: Heart,
  star: Star,
  Star: Star,
  fork: GitFork,
  GitFork: GitFork,
  gitBranch: GitBranch,
  GitBranch: GitBranch,
  share: Share2,
  Share2: Share2,
  check: Check,
  Check: Check,
  checkCheck: CheckCheck,
  CheckCheck: CheckCheck,
  checkCircle: CheckCircle,
  CheckCircle: CheckCircle,
  alert: AlertTriangle,
  alertTriangle: AlertTriangle,
  AlertTriangle: AlertTriangle,
  alertCircle: AlertCircle,
  AlertCircle: AlertCircle,
  plus: Plus,
  Plus: Plus,
  edit: Edit,
  Edit: Edit,
  edit2: Edit2,
  Edit2: Edit2,
  edit3: Edit3,
  Edit3: Edit3,
  trash: Trash,
  Trash: Trash,
  trash2: Trash2,
  Trash2: Trash2,
  download: Download,
  Download: Download,
  filter: Filter,
  Filter: Filter,
  refresh: RefreshCw,
  refreshCw: RefreshCw,
  RefreshCw: RefreshCw,
  lock: Lock,
  Lock: Lock,
  unlock: Unlock,
  Unlock: Unlock,
  mail: Mail,
  Mail: Mail,
  arrowRight: ArrowRight,
  ArrowRight: ArrowRight,
  external: ExternalLink,
  externalLink: ExternalLink,
  ExternalLink: ExternalLink,
  github: GithubIconNode,
  Github: GithubIconNode,
  menu: Menu,
  Menu: Menu,
  close: X,
  X: X,
  cpu: Cpu,
  Cpu: Cpu,
  barChart: BarChart,
  BarChart: BarChart,
  barChart2: BarChart2,
  BarChart2: BarChart2,
  fileText: FileText,
  FileText: FileText,
  fileSearch: FileSearch,
  FileSearch: FileSearch,
  eye: Eye,
  Eye: Eye,
  eyeOff: EyeOff,
  EyeOff: EyeOff,
  logout: LogOut,
  LogOut: LogOut,
  layers: Layers,
  Layers: Layers,
  chevronDown: ChevronDown,
  ChevronDown: ChevronDown,
  chevronRight: ChevronRight,
  ChevronRight: ChevronRight,
  send: Send,
  Send: Send,
  flag: Flag,
  Flag: Flag,
  award: Award,
  Award: Award,
  sparkles: Sparkles,
  Sparkles: Sparkles,
  terminal: Terminal,
  Terminal: Terminal,
  database: Database,
  Database: Database,
  boxes: Boxes,
  Boxes: Boxes,
  network: Network,
  Network: Network,
  ban: Ban,
  Ban: Ban,
  play: Play,
  Play: Play,
  pin: Pin,
  Pin: Pin,
  helpCircle: HelpCircle,
  HelpCircle: HelpCircle,
  info: Info,
  Info: Info,
  atSign: AtSign,
  AtSign: AtSign,
  server: Server,
  Server: Server,
  reply: Reply,
  Reply: Reply,
  copy: Copy,
  Copy: Copy
};

export type IconName = string;

export interface AppIconProps {
  name: IconName;
  /** Active / morph state icon: when provided and `active` is true, morphs to this target */
  activeName?: IconName;
  active?: boolean;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
  label?: string;
  onClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
}

/**
 * Standardized AppIcon component powered by Morphicons and Lucide data nodes.
 * Supports smooth physics-based morphing between states (e.g. Menu <-> Close, Eye <-> EyeOff).
 */
export const AppIcon: React.FC<AppIconProps> = ({
  name,
  activeName,
  active = false,
  size = 18,
  color,
  strokeWidth = 2,
  className = '',
  label,
  onClick
}) => {
  const primaryIcon = ICON_MAP[name] || ICON_MAP['activity'] || Activity;
  const targetIcon = activeName ? (ICON_MAP[activeName] || primaryIcon) : primaryIcon;
  const currentIcon = active ? targetIcon : primaryIcon;

  return (
    <MorphIcon
      icon={currentIcon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={`inline-block transition-colors duration-150 ${className}`}
      label={label}
      onClick={onClick}
    />
  );
};

export default AppIcon;
