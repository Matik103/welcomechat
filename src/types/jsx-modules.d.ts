
declare module "*.tsx" {
  import React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

// Allow importing .d.ts files
declare module "*.d.ts" {
  const content: any;
  export default content;
}
