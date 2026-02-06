
export const COLORS = {
  primary: '#E63946', // Pulse Red
  secondary: '#F1FAEE', // Life White
  action: '#457B9D', // Map Blue
  success: '#2A9D8F', // Vital Green
  text: '#1D3557', // Deep Navy
  white: '#FFFFFF',
  gray: '#F8F9FA',
  background: '#F8F9FA',
  darkGray: '#6C757D',
  error: '#FF0000',
};

export const TYPOGRAPHY = {
  fontFamily: 'System', // Using system font for now, can perform 'Inter' setup if needed
  weights: {
    regular: '400',
    medium: '500',
    bold: '700',
    extraBold: '800',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SHADOWS = {
  card: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floating: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  button: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
};
