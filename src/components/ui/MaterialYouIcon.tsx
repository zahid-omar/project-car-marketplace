'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Import Material Design Icons from MUI
import {
  Home,
  Search,
  Favorite,
  FavoriteBorder,
  Star,
  StarBorder,
  Person,
  PersonOutline,
  Settings,
  SettingsOutlined,
  Menu,
  Close,
  ArrowBack,
  ArrowForward,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Add,
  Remove,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Check,
  Clear,
  Error,
  Warning,
  Info,
  CheckCircle,
  Cancel,
  RadioButtonUnchecked,
  RadioButtonChecked,
  CheckBox,
  CheckBoxOutlineBlank,
  MoreVert,
  MoreHoriz,
  Refresh,
  Upload,
  Download,
  Share,
  LocationOn,
  DateRange,
  AttachMoney,
  DirectionsCar,
  Photo,
  CameraAlt,
  Send,
  Phone,
  Email,
  Notifications,
  NotificationsNone,
  Flag,
  FlagOutlined,
  Block,
  LightMode,
  DarkMode,
  Palette,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  GridView,
  FullscreenExit,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeOff,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  BatteryFull,
  SignalCellularAlt,
  Sync,
  SyncDisabled,
  Lock,
  LockOpen,
  Security,
  AccountCircle,
  Dashboard,
  Analytics,
  TrendingUp,
  TrendingDown,
  Public,
  Language,
  Help,
  HelpOutline,
  Feedback,
  BugReport,
  ContactSupport,
  Business,
  Work,
  School,
  House,
  Inbox,
  Schedule,
  North,
  ChatBubbleOutline,
  Reply,
  AccessTime,
  Archive,
  Forum,
  South,
  Message,
  Speed,
  Build
} from '@mui/icons-material';

// Material You icon variant types
export type MaterialYouIconVariant = 'outlined' | 'filled' | 'rounded' | 'sharp';
export type MaterialYouIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type MaterialYouIconWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700;

// Icon name mapping for easy migration from existing icons
export type MaterialYouIconName = 
  | 'home'
  | 'search'
  | 'heart'
  | 'heart-outline'
  | 'star'
  | 'star-outline'
  | 'user'
  | 'user-outline'
  | 'settings'
  | 'settings-outline'
  | 'menu'
  | 'close'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'plus'
  | 'minus'
  | 'edit'
  | 'trash'
  | 'eye'
  | 'eye-slash'
  | 'check'
  | 'x-mark'
  | 'exclamation-triangle'
  | 'exclamation-circle'
  | 'information-circle'
  | 'check-circle'
  | 'x-circle'
  | 'radio-unchecked'
  | 'radio-checked'
  | 'checkbox'
  | 'checkbox-outline'
  | 'ellipsis-vertical'
  | 'ellipsis-horizontal'
  | 'refresh'
  | 'upload'
  | 'download'
  | 'share'
  | 'map-pin'
  | 'calendar'
  | 'currency-dollar'
  | 'car'
  | 'photo'
  | 'camera'
  | 'paper-airplane'
  | 'phone'
  | 'envelope'
  | 'bell'
  | 'bell-outline'
  | 'flag'
  | 'flag-outline'
  | 'no-symbol'
  | 'sun'
  | 'moon'
  | 'palette'
  | 'adjustments-horizontal'
  | 'bars-arrow-up'
  | 'list-bullet'
  | 'squares-2x2'
  | 'view-columns'
  | 'arrows-pointing-out'
  | 'arrows-pointing-in'
  | 'magnifying-glass-plus'
  | 'magnifying-glass-minus'
  | 'play'
  | 'pause'
  | 'stop'
  | 'speaker-wave'
  | 'speaker-x-mark'
  | 'wifi'
  | 'wifi-slash'
  | 'cloud'
  | 'cloud-slash'
  | 'battery-100'
  | 'signal'
  | 'arrow-path'
  | 'arrow-path-slash'
  | 'lock-closed'
  | 'lock-open'
  | 'shield-check'
  | 'user-circle'
  | 'squares-plus'
  | 'chart-bar'
  | 'trending-up'
  | 'trending-down'
  | 'globe-alt'
  | 'language'
  | 'question-mark-circle'
  | 'question-mark-circle-outline'
  | 'chat-bubble-bottom-center-text'
  | 'bug-ant'
  | 'phone-arrow-up-right'
  | 'building-office'
  | 'briefcase'
  | 'academic-cap'
  | 'home-modern'
  | 'inbox'
  | 'schedule'
  | 'arrow-up'
  | 'chat-bubble-outline'
  | 'reply'
  | 'clock'
  | 'archive'
  | 'forum'
  | 'arrow-down'
  | 'message'
  | 'check_box_outline_blank'
  | 'speedometer'
  | 'location'
  | 'engine';

// Icon component mapping
const iconMap: Record<MaterialYouIconName, React.ComponentType<any>> = {
  'home': Home,
  'search': Search,
  'heart': Favorite,
  'heart-outline': FavoriteBorder,
  'star': Star,
  'star-outline': StarBorder,
  'user': Person,
  'user-outline': PersonOutline,
  'settings': Settings,
  'settings-outline': SettingsOutlined,
  'menu': Menu,
  'close': Close,
  'arrow-left': ArrowBack,
  'arrow-right': ArrowForward,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ExpandLess,
  'chevron-down': ExpandMore,
  'plus': Add,
  'minus': Remove,
  'edit': Edit,
  'trash': Delete,
  'eye': Visibility,
  'eye-slash': VisibilityOff,
  'check': Check,
  'x-mark': Clear,
  'exclamation-triangle': Warning,
  'exclamation-circle': Error,
  'information-circle': Info,
  'check-circle': CheckCircle,
  'x-circle': Cancel,
  'radio-unchecked': RadioButtonUnchecked,
  'radio-checked': RadioButtonChecked,
  'checkbox': CheckBox,
  'checkbox-outline': CheckBoxOutlineBlank,
  'ellipsis-vertical': MoreVert,
  'ellipsis-horizontal': MoreHoriz,
  'refresh': Refresh,
  'upload': Upload,
  'download': Download,
  'share': Share,
  'map-pin': LocationOn,
  'calendar': DateRange,
  'currency-dollar': AttachMoney,
  'car': DirectionsCar,
  'photo': Photo,
  'camera': CameraAlt,
  'paper-airplane': Send,
  'phone': Phone,
  'envelope': Email,
  'bell': Notifications,
  'bell-outline': NotificationsNone,
  'flag': Flag,
  'flag-outline': FlagOutlined,
  'no-symbol': Block,
  'sun': LightMode,
  'moon': DarkMode,
  'palette': Palette,
  'adjustments-horizontal': FilterList,
  'bars-arrow-up': Sort,
  'list-bullet': ViewList,
  'squares-2x2': ViewModule,
  'view-columns': GridView,
  'arrows-pointing-out': Fullscreen,
  'arrows-pointing-in': FullscreenExit,
  'magnifying-glass-plus': ZoomIn,
  'magnifying-glass-minus': ZoomOut,
  'play': PlayArrow,
  'pause': Pause,
  'stop': Stop,
  'speaker-wave': VolumeUp,
  'speaker-x-mark': VolumeOff,
  'wifi': Wifi,
  'wifi-slash': WifiOff,
  'cloud': Cloud,
  'cloud-slash': CloudOff,
  'battery-100': BatteryFull,
  'signal': SignalCellularAlt,
  'arrow-path': Sync,
  'arrow-path-slash': SyncDisabled,
  'lock-closed': Lock,
  'lock-open': LockOpen,
  'shield-check': Security,
  'user-circle': AccountCircle,
  'squares-plus': Dashboard,
  'chart-bar': Analytics,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'globe-alt': Public,
  'language': Language,
  'question-mark-circle': Help,
  'question-mark-circle-outline': HelpOutline,
  'chat-bubble-bottom-center-text': Feedback,
  'bug-ant': BugReport,
  'phone-arrow-up-right': ContactSupport,
  'building-office': Business,
  'briefcase': Work,
  'academic-cap': School,
  'home-modern': House,
  'inbox': Inbox,
  'schedule': Schedule,
  'arrow-up': North,
  'chat-bubble-outline': ChatBubbleOutline,
  'reply': Reply,
  'clock': AccessTime,
  'archive': Archive,
  'forum': Forum,
  'arrow-down': South,
  'message': Message,
  'check_box_outline_blank': CheckBoxOutlineBlank,
  'speedometer': Speed,
  'location': LocationOn,
  'engine': Build,
};

export interface MaterialYouIconProps {
  name: MaterialYouIconName;
  variant?: MaterialYouIconVariant;
  size?: MaterialYouIconSize;
  weight?: MaterialYouIconWeight;
  filled?: boolean;
  className?: string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const MaterialYouIcon = React.forwardRef<HTMLSpanElement, MaterialYouIconProps>(
  ({ 
    name, 
    variant = 'outlined',
    size = 'md',
    weight = 400,
    filled = false,
    className,
    'aria-hidden': ariaHidden,
    'aria-label': ariaLabel,
    onClick,
    style,
    ...props 
  }, ref) => {
    
    const IconComponent = iconMap[name];
    
    if (!IconComponent) {
      console.warn(`MaterialYouIcon: Icon "${name}" not found`);
      return null;
    }

    // Note: variant, weight, and filled props are reserved for future implementation
    // Currently using MUI icons with consistent Material You styling

    // Size classes following Material You specifications
    const sizeClasses = {
      'xs': 'text-[12px]', // 12px
      'sm': 'text-[16px]', // 16px  
      'md': 'text-[20px]', // 20px
      'lg': 'text-[24px]', // 24px
      'xl': 'text-[32px]', // 32px
      '2xl': 'text-[40px]', // 40px
    };

    // Base classes for Material You styling
    const baseClasses = cn(
      'flex-shrink-0 transition-colors duration-md-short2 ease-md-standard',
      sizeClasses[size],
      // Default Material You surface color
      'text-md-sys-on-surface-variant',
      // Future: Apply variant and weight styling based on props
      variant && `icon-variant-${variant}`,
      weight && `icon-weight-${weight}`,
      filled && 'icon-filled',
      // Interactive states if clickable
      onClick && [
        'cursor-pointer',
        'hover:text-md-sys-on-surface',
        'active:text-md-sys-primary',
        'focus:text-md-sys-primary',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-md-sys-primary',
        'focus:ring-offset-2',
        'rounded-full',
        'p-0.5',
      ],
      className
    );

    const iconProps = {
      className: baseClasses,
      style,
      'aria-hidden': ariaHidden,
      'aria-label': ariaLabel,
      onClick,
      fontSize: 'inherit',
      ...props,
    };

    return (
      <span ref={ref} className="inline-flex items-center justify-center">
        <IconComponent {...iconProps} />
      </span>
    );
  }
);

MaterialYouIcon.displayName = 'MaterialYouIcon';

export { MaterialYouIcon };

// Convenience exports for common icon combinations
export const MaterialYouIconFilled = (props: Omit<MaterialYouIconProps, 'filled'>) => (
  <MaterialYouIcon {...props} filled={true} />
);

export const MaterialYouIconOutlined = (props: Omit<MaterialYouIconProps, 'filled'>) => (
  <MaterialYouIcon {...props} filled={false} />
);

// Icon size constants for consistent usage
export const MATERIAL_YOU_ICON_SIZES = {
  xs: 'xs' as const,
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
  xl: 'xl' as const,
  '2xl': '2xl' as const,
};

// Icon weight constants for Material Design
export const MATERIAL_YOU_ICON_WEIGHTS = {
  thin: 100 as const,
  light: 200 as const,
  regular: 300 as const,
  medium: 400 as const,
  semibold: 500 as const,
  bold: 600 as const,
  heavy: 700 as const,
};

export default MaterialYouIcon; 