const loadingPromises: { [url: string]: Promise<any> } = {};

export function loadCommonJSScript<TExports>(url: string): Promise<TExports> {
  return loadingPromises[url] ||= new Promise((resolve, reject) => {
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

export function loadGlobalScript(url: string): Promise<void> {
  return loadingPromises[url] ||= new Promise((resolve, reject) => {
    const originalRequire = (window as any).require;
    (window as any).require = undefined;
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => { 
      window.require = originalRequire;
      resolve(void 0); 
    }
    script.onerror = (error) => {
      console.error(`Failed to load script from ${url}:`, error);
      window.require = originalRequire;
      reject(error);
    };
    document.head.appendChild(script);
  });
}

export async function loadGlobalScripts(urls: string[]): Promise<void> {
  for (const url of urls) {
    await loadGlobalScript(url);
  }
}