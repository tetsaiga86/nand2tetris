import fs from 'fs';

let file;

export function open(destFileName) {
  file = fs.openSync(destFileName, 'w');
  console.log('opened file for write', destFileName)
}

export function finish() {
  fs.closeSync(file);
  console.log('closed file')
}

export function write(commandString){
  fs.writeSync(file, commandString);
  console.log('wrote line', commandString)
}

export function openNoOverwrite(destFileName){
  file = fs.openSync(destFileName, 'a');
  console.log('opened file for append', destFileName)
}

export function writeFile(sourceFileName) {
  const sourceFileContents = fs.readFileSync(sourceFileName);
  fs.writeSync(file, sourceFileContents);
}
