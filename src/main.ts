import { parseCommand, executeCommand } from './cli.ts';
import { startRepl } from './repl.ts';

async function main() {
  const args = Deno.args;
  
  if (args.length === 0 || args[0] === 'repl' || args[0] === 'r') {
    // Start REPL mode
    await startRepl();
    return;
  }
  
  try {
    const { command, args: cmdArgs } = parseCommand(args.join(' '));
    const result = await executeCommand(command, cmdArgs);
    console.log(result);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}