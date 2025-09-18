export class VSCodeService {
  static openInVSCode(filePath: string): void {
    try {
      const vscodeUri = `vscode://file/${filePath}`;
      window.open(vscodeUri, '_blank');
    } catch (error) {
      console.error('Failed to open VS Code:', error);
      this.showVSCodeInstructions(filePath);
    }
  }

  static openDirectoryInVSCode(directoryPath: string): void {
    try {
      const vscodeUri = `vscode://file/${directoryPath}`;
      window.open(vscodeUri, '_blank');
    } catch (error) {
      console.error('Failed to open VS Code:', error);
      this.showVSCodeInstructions(directoryPath);
    }
  }

  private static showVSCodeInstructions(path: string): void {
    const instructions = `
VS Code could not be opened automatically.

To open this file in VS Code manually:
1. Open VS Code
2. Use File > Open... to navigate to: ${path}

Or use the command line:
code "${path}"

Make sure VS Code is installed and the 'code' command is available in your PATH.
    `.trim();

    alert(instructions);
  }

  static isVSCodeInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const testUrl = 'vscode://file/test';
      const startTime = Date.now();
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = testUrl;
      
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        document.body.removeChild(iframe);
        const elapsed = Date.now() - startTime;
        resolve(elapsed > 100);
      }, 100);
    });
  }

  static getSystemFilePath(webPath: string): string {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return (window as any).electronAPI.getSystemPath(webPath);
    }
    
    return webPath;
  }
}