declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.svg?react' {
  import { ComponentType, SVGProps } from 'react';
  const content: ComponentType<SVGProps<SVGElement>>;
  export default content;
}