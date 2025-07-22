import { parseCommand, executeCommand, showCurrentTask } from './cli.ts';

export async function startRepl(): Promise<void> {
  console.log('🎯 Taskell Interactive Mode');
  console.log('Type "help" for commands, "quit" to exit\n');
  
  while (true) {
    // Show current task status
    const status = await showCurrentTask();
    console.log(`\n${status}`);
    
    // Get user input
    const input = prompt('taskell> ');
    if (!input) continue;
    
    try {
      const { command, args } = parseCommand(input);
      const result = await executeCommand(command, args);
      
      if (result === 'quit') {
        console.log('Goodbye! 👋');
        break;
      }
      
      console.log(result);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}