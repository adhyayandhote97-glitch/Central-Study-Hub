"use client";
/**
 * Central icon module — Broadsheet uses Phosphor icons in the duotone weight
 * throughout. Every icon in the app is imported from here (not from
 * lucide-react), so the weight and set are consistent in one place.
 *
 * Each export is a thin wrapper that defaults `weight="duotone"` while still
 * accepting a `className` (e.g. `size-4`) and any Phosphor prop. Marked
 * "use client" because the Phosphor package initialises a React context at
 * import time, which isn't available in React Server Components — server
 * components import these as client islands.
 */
import * as React from "react";
import {
  Archive as P_Archive,
  ArrowCounterClockwise as P_ArrowCounterClockwise,
  ArrowLeft as P_ArrowLeft,
  ArrowRight as P_ArrowRight,
  Atom as P_Atom,
  Barbell as P_Barbell,
  BookOpen as P_BookOpen,
  Books as P_Books,
  Calculator as P_Calculator,
  CaretDown as P_CaretDown,
  CaretLeft as P_CaretLeft,
  CaretRight as P_CaretRight,
  CaretUp as P_CaretUp,
  ChartBar as P_ChartBar,
  ChatCircleDots as P_ChatCircleDots,
  ChatText as P_ChatText,
  Check as P_Check,
  CheckCircle as P_CheckCircle,
  CircleNotch as P_CircleNotch,
  Clock as P_Clock,
  ClockCounterClockwise as P_ClockCounterClockwise,
  CloudArrowUp as P_CloudArrowUp,
  Compass as P_Compass,
  Dna as P_Dna,
  DotsThree as P_DotsThree,
  DownloadSimple as P_DownloadSimple,
  Eye as P_Eye,
  EyeSlash as P_EyeSlash,
  FileArrowUp as P_FileArrowUp,
  FileDashed as P_FileDashed,
  FileDoc as P_FileDoc,
  FileImage as P_FileImage,
  FilePdf as P_FilePdf,
  FilePpt as P_FilePpt,
  FileText as P_FileText,
  FileXls as P_FileXls,
  FileZip as P_FileZip,
  Flask as P_Flask,
  FolderOpen as P_FolderOpen,
  FunnelSimple as P_FunnelSimple,
  Gear as P_Gear,
  GlobeHemisphereWest as P_GlobeHemisphereWest,
  GoogleDriveLogo as P_GoogleDriveLogo,
  GraduationCap as P_GraduationCap,
  HardDrives as P_HardDrives,
  Heart as P_Heart,
  Heartbeat as P_Heartbeat,
  Info as P_Info,
  Key as P_Key,
  Lightbulb as P_Lightbulb,
  LinkSimple as P_LinkSimple,
  List as P_List,
  MagnifyingGlass as P_MagnifyingGlass,
  MathOperations as P_MathOperations,
  Megaphone as P_Megaphone,
  Monitor as P_Monitor,
  Moon as P_Moon,
  Notebook as P_Notebook,
  Palette as P_Palette,
  Paperclip as P_Paperclip,
  PencilSimple as P_PencilSimple,
  PenNib as P_PenNib,
  PlayCircle as P_PlayCircle,
  Plus as P_Plus,
  Presentation as P_Presentation,
  Pulse as P_Pulse,
  PushPin as P_PushPin,
  PushPinSlash as P_PushPinSlash,
  Shapes as P_Shapes,
  ShieldCheck as P_ShieldCheck,
  Sigma as P_Sigma,
  SignOut as P_SignOut,
  Sparkle as P_Sparkle,
  SquaresFour as P_SquaresFour,
  Stack as P_Stack,
  Star as P_Star,
  Sun as P_Sun,
  Table as P_Table,
  Translate as P_Translate,
  Tray as P_Tray,
  Trash as P_Trash,
  UploadSimple as P_UploadSimple,
  User as P_User,
  VideoCamera as P_VideoCamera,
  Warning as P_Warning,
  WarningCircle as P_WarningCircle,
  X as P_X,
  XCircle as P_XCircle,
  type Icon as PhosphorIconType,
  type IconProps,
} from "@phosphor-icons/react";

export type IconType = PhosphorIconType;
/** Back-compat alias so existing `LucideIcon`-typed props keep working. */
export type LucideIcon = PhosphorIconType;

function duotone(Base: PhosphorIconType): PhosphorIconType {
  const Wrapped = React.forwardRef<SVGSVGElement, IconProps>(function Icon(props, ref) {
    return <Base ref={ref} weight="duotone" {...props} />;
  });
  Wrapped.displayName = "Icon";
  return Wrapped as unknown as PhosphorIconType;
}

// App-facing names (kept identical to the previous lucide names so imports
// only change their source path). Right-hand side is the Phosphor equivalent.
export const Activity = duotone(P_Pulse);
export const AlertCircle = duotone(P_WarningCircle);
export const Archive = duotone(P_Archive);
export const ArchiveRestore = duotone(P_ArrowCounterClockwise);
export const ArrowLeft = duotone(P_ArrowLeft);
export const ArrowRight = duotone(P_ArrowRight);
export const Atom = duotone(P_Atom);
export const BarChart3 = duotone(P_ChartBar);
export const BookOpen = duotone(P_BookOpen);
export const Books = duotone(P_Books);
export const Barbell = duotone(P_Barbell);
export const Brain = duotone(P_Lightbulb);
export const Calculator = duotone(P_Calculator);
export const Check = duotone(P_Check);
export const CheckIcon = Check;
export const ChevronDown = duotone(P_CaretDown);
export const ChevronDownIcon = ChevronDown;
export const ChevronLeftIcon = duotone(P_CaretLeft);
export const ChevronRight = duotone(P_CaretRight);
export const ChevronRightIcon = ChevronRight;
export const ChevronUpIcon = duotone(P_CaretUp);
export const CircleCheckIcon = duotone(P_CheckCircle);
export const Clock = duotone(P_Clock);
export const Compass = duotone(P_Compass);
export const Dna = duotone(P_Dna);
export const Download = duotone(P_DownloadSimple);
export const Eye = duotone(P_Eye);
export const EyeOff = duotone(P_EyeSlash);
export const FileArchive = duotone(P_FileZip);
export const FileDoc = duotone(P_FileDoc);
export const FileImage = duotone(P_FileImage);
export const FilePdf = duotone(P_FilePdf);
export const FilePpt = duotone(P_FilePpt);
export const FileQuestion = duotone(P_FileDashed);
export const FileSpreadsheet = duotone(P_FileXls);
export const FileText = duotone(P_FileText);
export const FileUp = duotone(P_FileArrowUp);
export const FlaskConical = duotone(P_Flask);
export const FolderOpen = duotone(P_FolderOpen);
export const Funnel = duotone(P_FunnelSimple);
export const Globe2 = duotone(P_GlobeHemisphereWest);
export const GoogleDrive = duotone(P_GoogleDriveLogo);
export const GraduationCap = duotone(P_GraduationCap);
export const HardDrive = duotone(P_HardDrives);
export const Heart = duotone(P_Heart);
export const HeartPulse = duotone(P_Heartbeat);
export const History = duotone(P_ClockCounterClockwise);
export const Image = duotone(P_FileImage);
export const Inbox = duotone(P_Tray);
export const Info = duotone(P_Info);
export const InfoIcon = Info;
export const KeyRound = duotone(P_Key);
export const Languages = duotone(P_Translate);
export const Layers = duotone(P_Stack);
export const LayoutDashboard = duotone(P_SquaresFour);
export const Lightbulb = duotone(P_Lightbulb);
export const Link2 = duotone(P_LinkSimple);
export const Loader2 = duotone(P_CircleNotch);
export const Loader2Icon = Loader2;
export const LogOut = duotone(P_SignOut);
export const MathOps = duotone(P_MathOperations);
export const Megaphone = duotone(P_Megaphone);
export const Menu = duotone(P_List);
export const MessageCircleHeart = duotone(P_ChatCircleDots);
export const MessageSquare = duotone(P_ChatText);
export const Monitor = duotone(P_Monitor);
export const Moon = duotone(P_Moon);
export const MoreHorizontal = duotone(P_DotsThree);
export const MoreHorizontalIcon = MoreHorizontal;
export const Notebook = duotone(P_Notebook);
export const OctagonXIcon = duotone(P_XCircle);
export const Palette = duotone(P_Palette);
export const Paperclip = duotone(P_Paperclip);
export const PenTool = duotone(P_PenNib);
export const Pencil = duotone(P_PencilSimple);
export const Pin = duotone(P_PushPin);
export const PinOff = duotone(P_PushPinSlash);
export const Plus = duotone(P_Plus);
export const Presentation = duotone(P_Presentation);
export const RotateCcw = duotone(P_ArrowCounterClockwise);
export const Search = duotone(P_MagnifyingGlass);
export const Settings = duotone(P_Gear);
export const Shapes = duotone(P_Shapes);
export const ShieldCheck = duotone(P_ShieldCheck);
export const Sigma = duotone(P_Sigma);
export const Sparkles = duotone(P_Sparkle);
export const SquarePlay = duotone(P_PlayCircle);
export const Star = duotone(P_Star);
export const Sun = duotone(P_Sun);
export const Table = duotone(P_Table);
export const Trash2 = duotone(P_Trash);
export const TriangleAlertIcon = duotone(P_Warning);
export const Upload = duotone(P_UploadSimple);
export const UploadCloud = duotone(P_CloudArrowUp);
export const User = duotone(P_User);
export const Video = duotone(P_VideoCamera);
export const X = duotone(P_X);
export const XIcon = X;
export const Youtube = duotone(P_PlayCircle);
