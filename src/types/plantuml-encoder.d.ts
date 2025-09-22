declare module 'plantuml-encoder' {
  export function encode(plantuml: string): string;
  export function decode(encoded: string): string;
  const encoder: {
    encode: typeof encode;
    decode: typeof decode;
  };
  export default encoder;
}