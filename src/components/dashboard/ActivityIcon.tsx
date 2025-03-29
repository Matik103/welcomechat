
import React from 'react';
import { 
  Users, Settings, Link, UserPlus, Edit, Trash2, 
  RotateCcw, Upload, Eye, Code, Image, Bot, 
  Key, LogOut, FileText, Mail, ShieldAlert, Calendar,
  AlertCircle, Check, File, MessageSquare, Globe, 
  FileCheck, FileWarning, FileMinus, FilePlus, Layout,
  CheckCircle, LogIn
} from 'lucide-react';
import { activityTypeToIcon } from '@/utils/activityTypeUtils';

interface ActivityIconProps {
  activityType: string;
  className?: string;
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({ activityType, className }) => {
  const getIcon = () => {
    if (activityTypeToIcon[activityType]) {
      const iconName = activityTypeToIcon[activityType];
      
      switch (iconName) {
        case 'users': return <Users className={className || "h-4 w-4"} />;
        case 'settings': return <Settings className={className || "h-4 w-4"} />;
        case 'link': return <Link className={className || "h-4 w-4"} />;
        case 'link-2': return <Link className={className || "h-4 w-4"} />;
        case 'user-plus': return <UserPlus className={className || "h-4 w-4"} />;
        case 'user': return <Users className={className || "h-4 w-4"} />;
        case 'user-x': return <Users className={className || "h-4 w-4"} />;
        case 'edit': return <Edit className={className || "h-4 w-4"} />;
        case 'trash': return <Trash2 className={className || "h-4 w-4"} />;
        case 'rotate-ccw': return <RotateCcw className={className || "h-4 w-4"} />;
        case 'upload': return <Upload className={className || "h-4 w-4"} />;
        case 'eye': return <Eye className={className || "h-4 w-4"} />;
        case 'code': return <Code className={className || "h-4 w-4"} />;
        case 'image': return <Image className={className || "h-4 w-4"} />;
        case 'bot': return <Bot className={className || "h-4 w-4"} />;
        case 'key': return <Key className={className || "h-4 w-4"} />;
        case 'log-out': return <LogOut className={className || "h-4 w-4"} />;
        case 'log-in': return <LogIn className={className || "h-4 w-4"} />;
        case 'file-text': return <FileText className={className || "h-4 w-4"} />;
        case 'file-plus': return <FilePlus className={className || "h-4 w-4"} />;
        case 'file-minus': return <FileMinus className={className || "h-4 w-4"} />;
        case 'file-check': return <FileCheck className={className || "h-4 w-4"} />;
        case 'file-warning': return <FileWarning className={className || "h-4 w-4"} />;
        case 'mail': return <Mail className={className || "h-4 w-4"} />;
        case 'alert-circle': return <AlertCircle className={className || "h-4 w-4"} />;
        case 'calendar': return <Calendar className={className || "h-4 w-4"} />;
        case 'check': return <Check className={className || "h-4 w-4"} />;
        case 'check-circle': return <CheckCircle className={className || "h-4 w-4"} />;
        case 'file': return <File className={className || "h-4 w-4"} />;
        case 'globe': return <Globe className={className || "h-4 w-4"} />;
        case 'layout': return <Layout className={className || "h-4 w-4"} />;
        default: return <MessageSquare className={className || "h-4 w-4"} />;
      }
    }
    
    if (activityType.includes('create') || activityType.includes('added')) {
      return <UserPlus className={className || "h-4 w-4 text-green-500"} />;
    }
    if (activityType.includes('delete') || activityType.includes('removed')) {
      return <Trash2 className={className || "h-4 w-4 text-red-500"} />;
    }
    if (activityType.includes('update') || activityType.includes('change') || activityType.includes('edited')) {
      return <Edit className={className || "h-4 w-4 text-blue-500"} />;
    }
    if (activityType.includes('error') || activityType.includes('failed')) {
      return <AlertCircle className={className || "h-4 w-4 text-red-500"} />;
    }
    if (activityType.includes('document') || activityType.includes('file')) {
      return <FileText className={className || "h-4 w-4 text-blue-500"} />;
    }
    if (activityType.includes('chat') || activityType.includes('message') || activityType.includes('interaction')) {
      return <MessageSquare className={className || "h-4 w-4 text-purple-500"} />;
    }
    if (activityType.includes('agent') || activityType.includes('ai_agent')) {
      return <Bot className={className || "h-4 w-4 text-indigo-500"} />;
    }
    
    return <MessageSquare className={className || "h-4 w-4 text-gray-500"} />;
  };

  return getIcon();
};
