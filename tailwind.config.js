import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [
        require("@tailwindcss/forms"), // plugin này có vẻ đang có
        require("daisyui"),           // **PHẢI CÓ** plugin này
    ],



    // daisyUI config (optional - here are the default values)
    daisyui: {
        themes: ["dark"], // false: only light + dark | true: all themes | array: only specified themes
        darkTheme: "dark", // name of one of the included themes for dark mode
        base: true, // applies background color and foreground color for root element
        styled: true, // include daisyUI colors and design decisions for all components
        utils: true, // adds responsive and modifier utility classes
        prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive classnames. Not colors)
        logs: true, // Shows info about daisyUI version and used config in the console
        themeRoot: ":root", // The element that receives theme color CSS variables
    },
};
