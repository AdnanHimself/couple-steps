/**
 * STRICT BLACK & WHITE COLOR SYSTEM
 * 
 * Design Philosophy:
 * - ONLY black (#000000) and white (#FFFFFF)
 * - NO gray shades allowed
 * - Maximum contrast for ultimate clarity
 */

export const Colors = {
    // ONLY TWO COLORS
    black: '#000000',
    white: '#FFFFFF',

    // ALIASES (all map to black or white)
    primary: '#000000',
    secondary: '#000000',
    background: '#FFFFFF',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    border: '#000000',
    borderDashed: '#000000',
    success: '#000000',
    warning: '#000000',
    danger: '#000000',
};
/**
 * LAYOUT CONSTANTS
 */
export const Layout = {
    padding: 20,
    borderRadius: 0, // Squared edges as requested

    // Header
    headerHeight: 100,
    headerPaddingTop: 50,
    headerPaddingHorizontal: 20,
    headerFontSize: 24,

    // Borders
    borderWidth: 1,
    borderWidthThick: 2,
    dashedBorderWidth: 2,
};
