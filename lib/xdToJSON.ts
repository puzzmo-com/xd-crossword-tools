import type { CrosswordJSON } from "./types"
import { xdParser } from "./xdparser2"

/** Takes an xd string and converts it into JSON */
export const xdToJSON = (xd: string): CrosswordJSON => xdParser(xd)
