import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        shell: '#F7F1E6',
        card: '#FFFCF4',
        sandbar: '#EDE3D0',
        ink: '#233029',
        ink2: '#54635A',
        mute: '#8E998F',
        coral: '#DE7A52',
        corald: '#C4613C',
        sea: '#2F6B64',
        gold: '#DFA63E',
        line: 'rgba(35,48,41,0.13)',
        line2: 'rgba(35,48,41,0.08)',
        night: {
          bg: '#141E1A',
          card: '#1B2620',
          card2: '#22302A',
          text: '#F2ECDF',
          sub: '#A9B4A7',
          line: 'rgba(242,236,223,0.13)',
        },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        sans: ['"Manrope Variable"', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['"Fragment Mono"', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(.22,1,.36,1)',
      },
      borderRadius: {
        arch: '999px 999px 24px 24px',
        archfull: '999px 999px 0 0',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        cue: {
          '0%, 100%': { opacity: '0.25', transform: 'scaleY(0.6)' },
          '50%': { opacity: '1', transform: 'scaleY(1)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        cue: 'cue 2.2s cubic-bezier(.22,1,.36,1) infinite',
      },
    },
  },
  plugins: [],
};
export default config;
