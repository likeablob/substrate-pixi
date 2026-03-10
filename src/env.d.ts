/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_COMMIT_HASH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*?url" {
  const content: string;
  export default content;
}
