import parseCommand from './parser.js'
import {write, open, finish, openNoOverwrite, writeFile} from './write.js'
var fs = require('fs');

function readFile(fileName){
  var readline = require('readline'),
  instream = fs.createReadStream(fileName),
  outstream = new (require('stream'))(),
  rl = readline.createInterface(instream, outstream);

  var outputFile = fileName.replace('vm', 'asm');
  open(outputFile);
  rl.on('line', (line) => {
    var massagedLine = line.replace(/\/\/.*|[\t\f\r]*/g, '').trim();
    if (massagedLine.length>0) {
      write(`// ${massagedLine}\n`)
      write(parseCommand(massagedLine));
    }
  });

  rl.on('close', (line) => {
    finish();
    console.log('done');
  })
}

export default function read(name) {
  var isDir = fs.lstatSync(name).isDirectory();

  if (isDir) {

    var files = fs.readdirSync(name),
        vmFiles = [];

    files.forEach((file) => {
      if (file.includes('.vm')) vmFiles.push(file);
    })

    vmFiles.sort((a, b) => {
      if (a === 'Sys.vm') return -1;
      if (b === 'Sys.vm') return 1;
      return a-b;
    })
    const dirSections = name.split('/')
    open(name+'/'+dirSections[dirSections.length-1]+'.vm')
    vmFiles.forEach((file) => {
      writeFile(name+'/'+file)
    })
    finish()
    readFile(name+'/'+dirSections[dirSections.length-1]+'.vm')
  }else{
    readFile(name);
  }
}
