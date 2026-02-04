/**
 * Utility to sanitize scanner input handling keyboard layout variations.
 * Handles:
 * 1. US Shift mode (scanner sends shift+num, OS is US) -> Symbols like !@#
 * 2. AZERTY mode (scanner sends num, OS is AZERTY) -> Symbols like &é"
 * 
 * @param input The raw input string
 * @param strictNumeric If true, removes all non-numeric characters after mapping (default: false)
 */
export const sanitizeInput = (input: string, strictNumeric: boolean = false): string => {
  if (!input) return '';
  
  let clean = input;

  // US Shift symbols: ! @ # $ % ^ & * ( )
  // AZERTY symbols:   & é " ' ( - è _ ç à
  
  const hasUSMarkers = /[!@#$%^*)]/.test(clean);

  if (hasUSMarkers) {
     const usMap: Record<string, string> = {
         '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', 
         '^': '6', '&': '7', '*': '8', '(': '9', ')': '0'
     };
     clean = clean.split('').map(c => usMap[c] || c).join('');
  } else {
     // AZERTY MAPPING
     // Note: If NOT strict numeric (e.g. Details field), we must preserve '-' and '_' 
     // as they are common text separators, even though they map to '6' and '8' in AZERTY numrow.
     const azertyMap: Record<string, string> = {
         '&': '1', 'é': '2', '"': '3', "'': '4', '(': '5', 
         'è': '7', 'ç': '9', 'à': '0'
     };

     // Only map - and _ if we are strictly expecting numbers
     if (strictNumeric) {
         azertyMap['-'] = '6';
         azertyMap['_'] = '8';
     }

     clean = clean.split('').map(c => azertyMap[c] || c).join('');
  }

  // If strict numeric mode is enabled, strip everything that is not a digit
  if (strictNumeric) {
      clean = clean.replace(/[^0-9]/g, '');
  }
  
  return clean.trim();
};