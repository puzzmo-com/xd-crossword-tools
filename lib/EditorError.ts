export class EditorError extends Error {
  rawMessage: string
  constructor(public message: string, public line: number) {
    super(message + "on line: " + line)
    this.rawMessage = message
    this.name = "XDError"
  }
}
