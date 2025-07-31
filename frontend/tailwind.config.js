/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}", // 👈 컴포넌트 추가 시 대응
        "./src/pages/**/*.{js,ts,jsx,tsx}", // ✅ 이걸 추가
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
