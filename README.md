# xd-crossword-tools

Tools for taking different crossword file formats and converting them to xd. Consolidates a few older libraries into a single repo with no dependencies, converts them all to TypeScript, ensures they run in a browser and Node, then adds some tests for them.

[xd](https://github.com/century-arcade/xd) is a text-based crossword format which is easy for humans to read and reason about.



### .puz to .xd

Builds on [puzjs](https://www.npmjs.com/package/puzjs) (ISC license).

```ts
import {puzToXd} from "xd-crossword-tools"

const puzResponse = await fetch(url)
const puzBuffer = await res.arrayBuffer()
const xd = puzToXd(puzBuffer)
```

### Filetypes this lib is open to adding

- http://www.ipuz.org
- https://www.xwordinfo.com/XPF/ / https://www.xwordinfo.com/JSON/
