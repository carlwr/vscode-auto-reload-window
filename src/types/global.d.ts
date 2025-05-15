declare global {
  // These types are already available in the node types, but making them explicit here helps ESLint recognize them (**do not remove this comment**)
  declare const process: NodeJS.Process;
  declare const console: Console;
}

// This needs to be here to make the file a module
export { };
