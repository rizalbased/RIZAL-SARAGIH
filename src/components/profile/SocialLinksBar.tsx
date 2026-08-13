import React from 'react';
import { SocialLinks } from '../../types';
import { Globe } from 'lucide-react';

interface SocialLinksBarProps {
  socialLinks?: SocialLinks;
  isEditable?: boolean;
}

export const formatSocialUrl = (platform: keyof SocialLinks, value: string): string => {
  if (!value) return '';
  const trimmed = value.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
    case 'tiktok':
      return `https://tiktok.com/@${trimmed.replace(/^@/, '')}`;
    case 'facebook':
      return `https://facebook.com/${trimmed}`;
    case 'whatsapp': {
      const cleanNum = trimmed.replace(/[^0-9]/g, '');
      const waNum = cleanNum.startsWith('0') ? `62${cleanNum.substring(1)}` : cleanNum;
      return `https://wa.me/${waNum}`;
    }
    case 'threads':
      return `https://threads.net/@${trimmed.replace(/^@/, '')}`;
    case 'twitter':
      return `https://x.com/${trimmed.replace(/^@/, '')}`;
    case 'discord':
      return trimmed.includes('discord.gg') ? `https://${trimmed}` : `https://discord.com/users/${trimmed}`;
    case 'youtube':
      return `https://youtube.com/@${trimmed.replace(/^@/, '')}`;
    case 'website':
      return `https://${trimmed}`;
    default:
      return trimmed;
  }
};

export const SocialLinksBar: React.FC<SocialLinksBarProps> = ({ socialLinks }) => {
  if (!socialLinks) return null;

  const platforms: Array<{
    key: keyof SocialLinks;
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    iconSvg: React.ReactNode;
  }> = [
    {
      key: 'instagram',
      label: 'Instagram',
      bgColor: 'bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 text-white',
      textColor: 'text-white',
      borderColor: 'border-pink-300',
      iconSvg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      bgColor: 'bg-black text-white',
      textColor: 'text-white',
      borderColor: 'border-gray-800',
      iconSvg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    },
    {
      key: 'facebook',
      label: 'Facebook',
      bgColor: 'bg-[#1877F2] text-white',
      textColor: 'text-white',
      borderColor: 'border-blue-500',
      iconSvg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      bgColor: 'bg-[#25D366] text-white',
      textColor: 'text-white',
      borderColor: 'border-green-500',
      iconSvg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      )
    },
    {
      key: 'threads',
      label: 'Threads',
      bgColor: 'bg-[#000000] text-white',
      textColor: 'text-white',
      borderColor: 'border-gray-800',
      iconSvg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.186 24c-2.38 0-4.498-.553-6.294-1.644-2.825-1.716-4.509-4.577-4.621-7.85-.116-3.398 1.34-6.43 3.987-8.318C7.151 4.832 9.8 4.02 12.872 4.02c2.81 0 5.253.754 7.065 2.18 1.741 1.371 2.76 3.267 2.87 5.34.1 1.884-.523 3.653-1.754 4.981-1.127 1.217-2.613 1.916-4.298 2.023-.19.012-.38.018-.57.018-1.572 0-2.922-.505-3.801-1.423-.748.913-1.842 1.488-3.13 1.488-2.222 0-3.904-1.578-3.904-3.664 0-2.261 1.96-3.868 4.764-3.868.966 0 1.89.186 2.673.538V9.897c0-1.742-1.34-2.83-3.486-2.83-1.878 0-3.23.82-3.351 2.039h-2.89c.15-2.618 2.493-4.639 6.241-4.639 3.847 0 6.376 2.028 6.376 5.127v5.334c0 1.096.388 1.621 1.157 1.621.57 0 1.157-.348 1.569-.93.593-.837.892-2.023.83-3.332-.08-1.512-.81-2.888-2.056-3.873-1.401-1.107-3.397-1.7-5.77-1.7-2.387 0-4.498.625-5.945 1.761-1.92 1.507-2.981 3.765-2.903 6.195.08 2.43 1.34 4.542 3.456 5.8 1.38.82 3.033 1.237 4.912 1.237 2.124 0 3.934-.51 5.381-1.518l1.492 2.298C17.397 23.368 14.974 24 12.186 24zm-1.872-11.455c-1.385 0-2.202.723-2.202 1.722 0 .937.734 1.603 1.854 1.603.957 0 1.774-.47 2.193-1.261.16-.301.242-.647.242-1.026v-.55c-.604-.308-1.32-.488-2.087-.488z"/>
        </svg>
      )
    },
    {
      key: 'twitter',
      label: 'X (Twitter)',
      bgColor: 'bg-black text-white',
      textColor: 'text-white',
      borderColor: 'border-gray-800',
      iconSvg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      key: 'discord',
      label: 'Discord',
      bgColor: 'bg-[#5865F2] text-white',
      textColor: 'text-white',
      borderColor: 'border-indigo-400',
      iconSvg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      )
    },
    {
      key: 'youtube',
      label: 'YouTube',
      bgColor: 'bg-[#FF0000] text-white',
      textColor: 'text-white',
      borderColor: 'border-red-500',
      iconSvg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      key: 'website',
      label: 'Website',
      bgColor: 'bg-gray-900 text-white',
      textColor: 'text-white',
      borderColor: 'border-gray-700',
      iconSvg: <Globe className="w-3.5 h-3.5" />
    }
  ];

  const activeSocials = platforms.filter(p => !!socialLinks[p.key]);

  if (activeSocials.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 my-2">
      {activeSocials.map(p => {
        const val = socialLinks[p.key]!;
        const url = formatSocialUrl(p.key, val);

        return (
          <a
            key={p.key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer ${p.bgColor}`}
            title={`${p.label}: ${val}`}
          >
            {p.iconSvg}
            <span>{p.label}</span>
          </a>
        );
      })}
    </div>
  );
};
