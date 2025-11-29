export function loadCommonJSScript<TExports>(url: string): Promise<TExports> {
  return new Promise((resolve, reject) => {
    // Load external pokedex data (CommonJS format)
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      const result = { ...window.exports } as TExports;
      (window as any).exports = undefined;
      resolve(result);
    };
    script.onerror = (error) => {
      console.error('Failed to load BattlePokedex:', error);
      reject(error);
    };
    
    // Provide a global exports object for the CommonJS module
    (window as any).exports = {};
    
    document.head.appendChild(script);
  });
}