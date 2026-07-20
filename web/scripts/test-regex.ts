import { preprocessObsidianMarkdown } from '../src/lib/markdown';

const md = `
> [!note]
>This is important

> [!important] Title Here
> Gradient Descent updates weights iteratively.
`;

console.log("ORIGINAL:");
console.log(md);
console.log("----------------------");
console.log("PROCESSED:");
console.log(preprocessObsidianMarkdown(md, {}));
