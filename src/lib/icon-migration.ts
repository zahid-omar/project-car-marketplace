/**
 * Icon Migration Utility
 * 
 * Maps existing Heroicons and Lucide React icons to Material You equivalents
 * Provides utilities for systematic migration to Material You design system
 */

import { MaterialYouIconName } from '@/components/ui/MaterialYouIcon';

// Heroicons to Material You mapping
export const heroiconsToMaterialYou: Record<string, MaterialYouIconName> = {
  // Basic Navigation & Actions
  'ChevronLeftIcon': 'chevron-left',
  'ChevronRightIcon': 'chevron-right', 
  'ChevronUpIcon': 'chevron-up',
  'ChevronDownIcon': 'chevron-down',
  'ChevronDoubleLeftIcon': 'chevron-left',
  'ChevronDoubleRightIcon': 'chevron-right',
  'ArrowLeftIcon': 'arrow-left',
  'ArrowRightIcon': 'arrow-right',
  'XMarkIcon': 'x-mark',
  'PlusIcon': 'plus',
  'MinusIcon': 'minus',
  'CheckIcon': 'check',
  'Bars3Icon': 'menu',
  'ArrowPathIcon': 'refresh',

  // User & Account
  'UserIcon': 'user',
  'UserCircleIcon': 'user-circle',

  // Heart & Favorites  
  'HeartIcon': 'heart-outline',
  'HeartIconSolid': 'heart',

  // Stars & Ratings
  'StarIcon': 'star',
  'StarOutlineIcon': 'star-outline',

  // Visibility & Eye
  'EyeIcon': 'eye',
  'EyeSlashIcon': 'eye-slash',

  // Search & Magnifying Glass
  'MagnifyingGlassIcon': 'search',

  // Photo & Camera
  'PhotoIcon': 'photo',
  'CameraIcon': 'camera',

  // Location & Map
  'MapPinIcon': 'map-pin',

  // Calendar & Date
  'CalendarIcon': 'calendar',

  // Edit & Pencil
  'PencilIcon': 'edit',

  // Trash & Delete
  'TrashIcon': 'trash',

  // Flag & Report
  'FlagIcon': 'flag',

  // Settings & Adjustments
  'AdjustmentsHorizontalIcon': 'adjustments-horizontal',
  'CogIcon': 'settings',

  // View & Layout
  'Squares2X2Icon': 'squares-2x2',
  'ListBulletIcon': 'list-bullet',
  'ViewColumnsIcon': 'view-columns',

  // Charts & Analytics
  'ChartBarIcon': 'chart-bar',

  // Communication
  'EnvelopeIcon': 'envelope',
  'ChatBubbleBottomCenterTextIcon': 'chat-bubble-bottom-center-text',
  'PaperAirplaneIcon': 'paper-airplane',

  // Notifications
  'BellIcon': 'bell',
  'BellSlashIcon': 'bell-outline',

  // Status & Alerts
  'CheckCircleIcon': 'check-circle',
  'XCircleIcon': 'x-circle',
  'ExclamationTriangleIcon': 'exclamation-triangle',
  'ExclamationCircleIcon': 'exclamation-circle',
  'InformationCircleIcon': 'information-circle',

  // More Actions
  'EllipsisVerticalIcon': 'ellipsis-vertical',
  'EllipsisHorizontalIcon': 'ellipsis-horizontal',

  // Arrows & Direction
  'ArrowUpIcon': 'chevron-up',
  'ArrowDownIcon': 'chevron-down',

  // Connectivity & Network
  'WifiIcon': 'wifi',
  'CloudIcon': 'cloud',

  // Home & Buildings
  'HomeIcon': 'home',
  'BuildingOfficeIcon': 'building-office',

  // Tools & Utils
  'WrenchIcon': 'settings',
  'BugAntIcon': 'bug-ant',

  // Money & Finance
  'CurrencyDollarIcon': 'currency-dollar',

  // Vehicle & Transport
  'TruckIcon': 'car',

  // Media & Playback
  'PlayIcon': 'play',
  'PauseIcon': 'pause',
  'StopIcon': 'stop',

  // Volume & Audio
  'SpeakerWaveIcon': 'speaker-wave',
  'SpeakerXMarkIcon': 'speaker-x-mark',

  // Share & Export
  'ShareIcon': 'share',
  'ArrowUpTrayIcon': 'upload',
  'ArrowDownTrayIcon': 'download',

  // Security & Lock
  'LockClosedIcon': 'lock-closed',
  'LockOpenIcon': 'lock-open',
  'ShieldCheckIcon': 'shield-check',

  // Filters & Sorting
  'FunnelIcon': 'adjustments-horizontal',
  'BarsArrowUpIcon': 'bars-arrow-up',

  // Question & Help
  'QuestionMarkCircleIcon': 'question-mark-circle',
};

// Lucide React to Material You mapping
export const lucideToMaterialYou: Record<string, MaterialYouIconName> = {
  // Basic Icons
  'Home': 'home',
  'Search': 'search', 
  'Heart': 'heart-outline',
  'Star': 'star',
  'User': 'user',
  'Settings': 'settings',
  'Menu': 'menu',
  'X': 'x-mark',
  'Plus': 'plus',
  'Minus': 'minus',
  'Check': 'check',

  // Navigation
  'ChevronLeft': 'chevron-left',
  'ChevronRight': 'chevron-right',
  'ChevronUp': 'chevron-up', 
  'ChevronDown': 'chevron-down',
  'ArrowLeft': 'arrow-left',
  'ArrowRight': 'arrow-right',

  // Communication
  'MessageCircle': 'chat-bubble-bottom-center-text',
  'Send': 'paper-airplane',
  'Mail': 'envelope',
  'Phone': 'phone',

  // Media & Files
  'Image': 'photo',
  'Camera': 'camera',
  'Upload': 'upload',
  'Download': 'download',

  // Status & Alerts
  'CheckCircle': 'check-circle',
  'XCircle': 'x-circle',
  'AlertTriangle': 'exclamation-triangle',
  'AlertCircle': 'exclamation-circle',
  'Info': 'information-circle',

  // View & Layout
  'Grid3X3': 'squares-2x2',
  'List': 'list-bullet',
  'Filter': 'adjustments-horizontal',

  // Edit & Actions  
  'Edit': 'edit',
  'Trash2': 'trash',
  'Eye': 'eye',
  'EyeOff': 'eye-slash',

  // More & Options
  'MoreVertical': 'ellipsis-vertical',
  'MoreHorizontal': 'ellipsis-horizontal',

  // Theme & Appearance
  'Sun': 'sun',
  'Moon': 'moon',
  'Palette': 'palette',

  // Connectivity
  'Wifi': 'wifi',
  'WifiOff': 'wifi-slash',
  'Cloud': 'cloud',
  'CloudOff': 'cloud-slash',

  // Notifications
  'Bell': 'bell',
  'BellOff': 'bell-outline',

  // Security
  'Lock': 'lock-closed',
  'Unlock': 'lock-open',
  'Shield': 'shield-check',

  // Finance
  'DollarSign': 'currency-dollar',

  // Vehicle
  'Car': 'car',

  // Location
  'MapPin': 'map-pin',

  // Calendar
  'Calendar': 'calendar',

  // Refresh & Sync
  'RefreshCw': 'refresh',
  'RotateCcw': 'arrow-path',

  // Sorting
  'SortAsc': 'bars-arrow-up',
  'SortDesc': 'bars-arrow-up',

  // Flag
  'Flag': 'flag',

  // Share
  'Share': 'share',
  'ExternalLink': 'arrows-pointing-out',

  // Help
  'HelpCircle': 'question-mark-circle',

  // Analytics
  'BarChart': 'chart-bar',
  'TrendingUp': 'trending-up',
  'TrendingDown': 'trending-down',

  // Work & Business
  'Briefcase': 'briefcase',
  'Building': 'building-office',

  // Controls
  'Play': 'play',
  'Pause': 'pause',
  'Square': 'stop',

  // Volume
  'Volume2': 'speaker-wave',
  'VolumeX': 'speaker-x-mark',

  // Zoom
  'ZoomIn': 'magnifying-glass-plus',
  'ZoomOut': 'magnifying-glass-minus',

  // Fullscreen
  'Maximize': 'arrows-pointing-out',
  'Minimize': 'arrows-pointing-in',

  // Radio & Checkbox
  'Circle': 'radio-unchecked',
  'CheckSquare': 'checkbox',
  'SquareOutline': 'checkbox-outline',
};

// Migration helpers
export interface IconMigrationInfo {
  originalIcon: string;
  materialYouIcon: MaterialYouIconName;
  migrationNotes?: string;
  requiresManualReview?: boolean;
}

/**
 * Get Material You equivalent for a Heroicon
 */
export function getHeroiconEquivalent(heroiconName: string): IconMigrationInfo | null {
  const materialYouIcon = heroiconsToMaterialYou[heroiconName];
  
  if (!materialYouIcon) {
    return null;
  }

  return {
    originalIcon: heroiconName,
    materialYouIcon,
    migrationNotes: `Migrate from Heroicons ${heroiconName} to Material You ${materialYouIcon}`,
  };
}

/**
 * Get Material You equivalent for a Lucide icon
 */
export function getLucideEquivalent(lucideName: string): IconMigrationInfo | null {
  const materialYouIcon = lucideToMaterialYou[lucideName];
  
  if (!materialYouIcon) {
    return null;
  }

  return {
    originalIcon: lucideName,
    materialYouIcon,
    migrationNotes: `Migrate from Lucide ${lucideName} to Material You ${materialYouIcon}`,
  };
}

/**
 * Generate migration report for icons used in a file
 */
export function generateIconMigrationReport(fileContent: string): IconMigrationInfo[] {
  const migrations: IconMigrationInfo[] = [];

  // Find Heroicons imports and usage
  const heroiconMatches = fileContent.match(/import\s+{[^}]+}\s+from\s+['"]@heroicons\/react\/24\/(solid|outline)['"]/g);
  if (heroiconMatches) {
    heroiconMatches.forEach(match => {
      const iconNames = match.match(/{([^}]+)}/)?.[1]
        ?.split(',')
        ?.map(name => name.trim().replace(/\s+as\s+\w+/, ''));
      
      iconNames?.forEach(iconName => {
        const migration = getHeroiconEquivalent(iconName);
        if (migration) {
          migrations.push(migration);
        }
      });
    });
  }

  // Find Lucide imports and usage
  const lucideMatches = fileContent.match(/import\s+{[^}]+}\s+from\s+['"]lucide-react['"]/g);
  if (lucideMatches) {
    lucideMatches.forEach(match => {
      const iconNames = match.match(/{([^}]+)}/)?.[1]
        ?.split(',')
        ?.map(name => name.trim());
      
      iconNames?.forEach(iconName => {
        const migration = getLucideEquivalent(iconName);
        if (migration) {
          migrations.push(migration);
        }
      });
    });
  }

  return migrations;
}

/**
 * Priority icons for migration (most commonly used)
 */
export const PRIORITY_ICONS: MaterialYouIconName[] = [
  'home',
  'search',
  'heart',
  'heart-outline',
  'star',
  'star-outline',
  'user',
  'user-circle',
  'settings',
  'menu',
  'close',
  'x-mark',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'chevron-down',
  'plus',
  'minus',
  'check',
  'edit',
  'trash',
  'eye',
  'eye-slash',
  'bell',
  'bell-outline',
  'photo',
  'camera',
  'map-pin',
  'calendar',
  'currency-dollar',
  'car',
];

export default {
  heroiconsToMaterialYou,
  lucideToMaterialYou,
  getHeroiconEquivalent,
  getLucideEquivalent,
  generateIconMigrationReport,
  PRIORITY_ICONS,
}; 