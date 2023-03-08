export interface ICommand {
  handler: (arg?: string) => string;
}
