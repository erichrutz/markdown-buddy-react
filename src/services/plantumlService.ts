import plantumlEncoder from 'plantuml-encoder';

export class PlantUMLService {
  private static readonly PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';
  
  /**
   * Process PlantUML diagrams in a container element
   */
  static processPlantUMLDiagrams(container: HTMLElement): void {
    try {
      const plantUMLBlocks = container.querySelectorAll('pre code.language-plantuml, pre code.language-puml');
      
      plantUMLBlocks.forEach((block) => {
        const content = block.textContent || '';
        if (content.trim()) {
          this.renderPlantUMLDiagram(block as HTMLElement, content);
        }
      });
    } catch (error) {
      console.error('PlantUMLService: Error processing PlantUML diagrams:', error);
    }
  }

  /**
   * Render a single PlantUML diagram
   */
  private static renderPlantUMLDiagram(element: HTMLElement, plantUMLCode: string): void {
    try {
      // Clean up the PlantUML code
      let cleanCode = plantUMLCode.trim();
      
      // Add @startuml/@enduml if not present
      if (!cleanCode.startsWith('@start')) {
        cleanCode = `@startuml\n${cleanCode}\n@enduml`;
      }
      
      // Encode the PlantUML code
      const encoded = plantumlEncoder.encode(cleanCode);
      
      // Generate the image URL
      const imageUrl = `${this.PLANTUML_SERVER}/svg/${encoded}`;
      
      // Create container for the diagram
      const diagramContainer = document.createElement('div');
      diagramContainer.className = 'plantuml-diagram';
      diagramContainer.style.cssText = `
        margin: 16px 0;
        text-align: center;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 16px;
        background-color: white;
      `;
      
      // Create image element
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = 'PlantUML Diagram';
      img.style.cssText = `
        max-width: 100%;
        height: auto;
      `;
      
      // Handle image load and error
      img.onload = () => {
        console.log('PlantUMLService: Diagram loaded successfully');
      };
      
      img.onerror = () => {
        console.error('PlantUMLService: Failed to load diagram');
        diagramContainer.innerHTML = `
          <div style="color: #f44336; padding: 16px; text-align: center;">
            <strong>PlantUML Diagram Error</strong><br>
            Failed to render diagram. Please check your PlantUML syntax.
          </div>
        `;
      };
      
      // Add loading indicator
      diagramContainer.innerHTML = `
        <div style="color: #666; padding: 16px;">
          Loading PlantUML diagram...
        </div>
      `;
      
      diagramContainer.appendChild(img);
      
      // Replace the code block with the diagram
      const preElement = element.closest('pre');
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(diagramContainer, preElement);
      }
      
    } catch (error) {
      console.error('PlantUMLService: Error rendering diagram:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'plantuml-error';
      errorDiv.style.cssText = `
        margin: 16px 0;
        padding: 16px;
        border: 1px solid #f44336;
        border-radius: 4px;
        background-color: #ffebee;
        color: #c62828;
        text-align: center;
      `;
      errorDiv.innerHTML = `
        <strong>PlantUML Error</strong><br>
        ${error instanceof Error ? error.message : 'Unknown error occurred'}
      `;
      
      const preElement = element.closest('pre');
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(errorDiv, preElement);
      }
    }
  }

  /**
   * Check if PlantUML server is available
   */
  static async checkServerAvailability(): Promise<boolean> {
    try {
      const testCode = '@startuml\nAlice -> Bob: Hello\n@enduml';
      const encoded = plantumlEncoder.encode(testCode);
      const testUrl = `${this.PLANTUML_SERVER}/svg/${encoded}`;
      
      const response = await fetch(testUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}