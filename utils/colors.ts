export const colors = {
  background: '#19161a',
  surface: '#28232a',
  primary: '#452451',
  text: {
    primary: '#ded7e0',
    secondary: '#8b6699',
  },
  status: {
    success: '#24512b',
    error: '#51242d',
    warning: '#51410c',
  },
  rewards: {
    accent: '#efa504',
    secondary: '#de9400',
  }
} as const;

export type ColorKey = keyof typeof colors;