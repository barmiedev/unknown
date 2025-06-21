import React from 'react';
import { Instagram, Twitter, Facebook, Youtube, Globe, Github, ExternalLink } from 'lucide-react-native';
import { colors } from '@/utils/colors';

interface SocialIconProps {
  platform: string;
  size?: number;
  color?: string;
}

const SocialIcon: React.FC<SocialIconProps> = ({ platform, size = 24, color = colors.text.primary }) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram size={size} color={color} strokeWidth={2} />;
    case 'twitter':
      return <Twitter size={size} color={color} strokeWidth={2} />;
    case 'facebook':
      return <Facebook size={size} color={color} strokeWidth={2} />;
    case 'youtube':
      return <Youtube size={size} color={color} strokeWidth={2} />;
    case 'website':
      return <Globe size={size} color={color} strokeWidth={2} />;
    case 'github':
      return <Github size={size} color={color} strokeWidth={2} />;
    default:
      return <ExternalLink size={size} color={color} strokeWidth={2} />;
  }
};

export default SocialIcon; 