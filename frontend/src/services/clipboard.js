// Copies text to the clipboard. Returns true when it worked.
export async function copyText(text) {
  try {
    // Modern way (needs https or localhost)
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Old fallback: use a hidden text box
    try {
      const box = document.createElement('textarea');
      box.value = text;
      box.style.position = 'fixed';
      box.style.opacity = '0';
      document.body.appendChild(box);
      box.select();
      const worked = document.execCommand('copy');
      document.body.removeChild(box);
      return worked;
    } catch (fallbackError) {
      return false;
    }
  }
}
