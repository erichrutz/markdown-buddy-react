declare module 'plantuml-encoder' {
  function encode(plantumlCode: string): string;
  function decode(encodedCode: string): string;
  
  export { encode, decode };
  export default { encode, decode };
}