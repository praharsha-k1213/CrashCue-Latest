/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./context/**/*.{js,jsx,ts,tsx}",
        "./hooks/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#5B5FED',
                secondary: '#8B5FED',
                accent: '#FFA500',
                success: '#10B981',
                danger: '#EF4444',
                warning: '#F59E0B',
                dark: '#1F2937',
                darker: '#374151',
            },
        },
    },
    plugins: [],
}
