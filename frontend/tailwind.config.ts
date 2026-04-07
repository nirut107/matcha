/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
	  "./app/**/*.{js,ts,jsx,tsx,mdx}",
	  "./components/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
	  extend: {
		// 1. Define the movement (Keyframes)
		keyframes: {
		  shimmer: {
			'0%': { transform: 'translateX(-100%)' },
			'100%': { transform: 'translateX(100%)' },
		  },
		},
		// 2. Define the animation name and timing
		animation: {
		  shimmer: 'shimmer 1.5s infinite',
		},
	  },
	},
	plugins: [],
  };
