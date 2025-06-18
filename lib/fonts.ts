export const fonts = {
  chillax: {
    extralight: 'Chillax-Extralight',
    light: 'Chillax-Light',
    regular: 'Chillax-Regular',
    medium: 'Chillax-Medium',
    semibold: 'Chillax-Semibold',
    bold: 'Chillax-Bold',
  },
} as const;

export type FontWeight = keyof typeof fonts.chillax; 