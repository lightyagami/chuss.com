import React from 'react';
import type { MoveClassification } from '../types/chess';
import { 
  Sparkles, 
  CheckCircle2, 
  ThumbsUp, 
  HelpCircle, 
  AlertTriangle, 
  AlertOctagon, 
  XCircle, 
  BookOpen, 
  Star 
} from 'lucide-react';

interface Props {
  classification?: MoveClassification;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const getClassificationDetails = (c?: MoveClassification) => {
  switch (c) {
    case 'brilliant':
      return {
        label: 'Brilliant',
        color: 'text-cyan-800 bg-cyan-50 border-cyan-300',
        badgeBg: 'bg-cyan-600 text-white',
        icon: Sparkles,
      };
    case 'great':
      return {
        label: 'Great',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-300',
        badgeBg: 'bg-emerald-600 text-white',
        icon: Sparkles,
      };
    case 'best':
      return {
        label: 'Best',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-300',
        badgeBg: 'bg-emerald-600 text-white',
        icon: CheckCircle2,
      };
    case 'excellent':
      return {
        label: 'Excellent',
        color: 'text-teal-800 bg-teal-50 border-teal-300',
        badgeBg: 'bg-teal-600 text-white',
        icon: Star,
      };
    case 'good':
      return {
        label: 'Good',
        color: 'text-blue-800 bg-blue-50 border-blue-300',
        badgeBg: 'bg-blue-600 text-white',
        icon: ThumbsUp,
      };
    case 'inaccuracy':
      return {
        label: 'Inaccuracy',
        color: 'text-amber-800 bg-amber-50 border-amber-300',
        badgeBg: 'bg-amber-600 text-white',
        icon: HelpCircle,
      };
    case 'mistake':
      return {
        label: 'Mistake',
        color: 'text-orange-800 bg-orange-50 border-orange-300',
        badgeBg: 'bg-orange-600 text-white',
        icon: AlertTriangle,
      };
    case 'blunder':
      return {
        label: 'Blunder',
        color: 'text-red-800 bg-red-50 border-red-300',
        badgeBg: 'bg-red-600 text-white',
        icon: AlertOctagon,
      };
    case 'missed_win':
      return {
        label: 'Missed Win',
        color: 'text-rose-800 bg-rose-50 border-rose-300',
        badgeBg: 'bg-rose-600 text-white',
        icon: XCircle,
      };
    case 'book':
      return {
        label: 'Book',
        color: 'text-slate-800 bg-slate-100 border-slate-300',
        badgeBg: 'bg-slate-700 text-white',
        icon: BookOpen,
      };
    default:
      return null;
  }
};

export const ClassificationBadge: React.FC<Props> = ({ classification, showText = true, size = 'md' }) => {
  const details = getClassificationDetails(classification);
  if (!details) return null;

  const Icon = details.icon;
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
    lg: 'text-sm px-2.5 py-1 gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${details.color} ${sizeClasses[size]}`}
      title={details.label}
    >
      <Icon size={iconSizes[size]} className="shrink-0" />
      {showText && <span>{details.label}</span>}
    </span>
  );
};
