
import React from 'react';

export interface ChatHeaderProps {
  headerTitle: string;
  headerSubtitle: string;
  logoUrl?: string;
  headerBgColor?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  headerTitle,
  headerSubtitle,
  logoUrl,
  headerBgColor = '#4F46E5'
}) => {
  return (
    <div 
      className="p-4 flex items-center space-x-3"
      style={{ backgroundColor: headerBgColor }}
    >
      {logoUrl && (
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
          <img
            src={logoUrl}
            alt="Assistant logo"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="text-white">
        <h3 className="font-medium text-lg">{headerTitle}</h3>
        <p className="text-sm opacity-90">{headerSubtitle}</p>
      </div>
    </div>
  );
};
