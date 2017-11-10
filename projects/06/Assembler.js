var fs = require('fs');
var add = './add/Add.asm';
var max = './max/Max.asm';
var pong = './pong/Pong.asm';
var rect = './rect/Rect.asm';
var binaryCommands = '';
var counter = 16;
var symbolTable = {
  'SCREEN': 16384,
  'KBD': 24576,
  'SP': 0,
  'LCL': 1,
  'ARG': 2,
  'THIS': 3,
  'THAT': 4
}

for (var i = 0; i <= 15; i++) {
  symbolTable[`R${i}`]=i;
}

function make16bit(binaryString){
  var changed = binaryString
  for (var i = 0; i < 16-binaryString.length; i++) {
    changed = '0' + changed
  }
  return changed
}

function asmToBinary(command){
  if (command.split('')[0]=='@') {
    command=command.replace('@','');
    var binaryCommand = parseInt(command, 10).toString(2);
    binaryCommands = binaryCommands.concat(make16bit(binaryCommand)+('\n'));
  }else{
    var binaryCommand = '111'
    var equalsIdx = command.indexOf('=');
    var semiIdx = command.indexOf(';');
    var dest, comp, jump;
    if (equalsIdx!=-1) {
      var destSymbol = command.slice(0,equalsIdx);
      switch (destSymbol) {
        case 'M':
          dest='001';
          break;
        case 'D':
          dest='010';
          break;
        case 'MD':
          dest='011';
          break;
        case 'A':
          dest='100';
          break;
        case 'AM':
          dest='101';
          break;
        case 'AD':
          dest='110';
          break;
        case 'AMD':
          dest='111';
          break;
      }
    }else{
      dest='000'
    }
    var compSymbol
    if (semiIdx!=-1) {
      if(equalsIdx==-1){
        compSymbol = command.slice(0,semiIdx);
      }else{
        compSymbol = command.slice(equalsIdx+1, semiIdx)
      }
    }else{
      compSymbol = command.slice(equalsIdx+1, command.length)
    }
    switch (compSymbol) {
      case '0':
        comp='0101010';
        break;
      case '1':
        comp='0111111';
        break;
      case '-1':
        comp='0111010';
        break;
      case 'D':
        comp='0001100';
        break;
      case 'A':
        comp='0110000';
        break;
      case '!D':
        comp='0001101';
        break;
      case '!A':
        comp='0110001';
        break;
      case '-D':
        comp='0001111';
        break;
      case '-A':
        comp='0110011';
        break;
      case 'D+1':
        comp='0011111';
        break;
      case 'A+1':
        comp='0110111';
        break;
      case 'D-1':
        comp='0001110';
        break;
      case 'A-1':
        comp='0110010';
        break;
      case 'D+A':
        comp='0000010';
        break;
      case '0':
        comp='0101010';
        break;
      case '1':
        comp='0111111';
        break;
      case '-1':
        comp='0111010';
        break;
      case 'D':
        comp='0001100';
        break;
      case 'A':
        comp='0110000';
        break;
      case '!D':
        comp='0001101';
        break;
      case '!A':
        comp='0110001';
        break;
      case '-D':
        comp='0001111';
        break;
      case '-A':
        comp='0110011';
        break;
      case 'D+1':
        comp='0011111';
        break;
      case 'A+1':
        comp='0110111';
        break;
      case 'D-1':
        comp='0001110';
        break;
      case 'A-1':
        comp='0110010';
        break;
      case 'D+A':
        comp='0000010';
        break;
      case 'D-A':
        comp='0010011';
        break;
      case 'A-D':
        comp='0000111';
        break;
      case 'D&A':
        comp='0000000';
        break;
      case 'D|A':
        comp='0010101';
        break;
      case 'M':
        comp='1110000';
        break;
      case '!M':
        comp='1110001';
        break;
      case '-M':
        comp='1110011';
        break;
      case 'M+1':
        comp='1110111';
        break;
      case 'M-1':
        comp='1110010';
        break;
      case 'D+M':
        comp='1000010';
        break;
      case 'D-M':
        comp='1010011';
        break;
      case 'M-D':
        comp='1000111';
        break;
      case 'D&M':
        comp='1000000';
        break;
      case 'D|M':
        comp='1010101';
        break;
    }
    if(semiIdx!=-1){
      var jumpSymbol = command.slice(semiIdx+1, command.length);
      switch (jumpSymbol) {
        case 'JGT':
            jump='001'
          break;
        case 'JEQ':
            jump='010'
          break;
        case 'JGE':
            jump='011'
          break;
        case 'JLT':
            jump='100'
          break;
        case 'JNE':
            jump='101'
          break;
        case 'JLE':
            jump='110'
          break;
        case 'JMP':
            jump='111'
          break;
      }
    }else{
      jump='000'
    }
    binaryCommands = binaryCommands.concat(binaryCommand+comp+dest+jump+'\n')
  }
}

function Assemble(data, fileName){
  //break apart into commands
  var lineCommands = [];
  data = data.split('\n');
  for (var idx in data) {
    var row = data[idx];
    splitRow = row.split('');
    if (splitRow[0]!='/' && splitRow[0]!='\r') {
      if(splitRow[0]=='('){
        var varName = row.replace('(', '').replace(')', '');
        symbolTable[varName] = lineCommands.length
        console.log(symbolTable);
        break;
      }
      if(splitRow[0]=='@'){
        row = row.replace('@','').replace('\r', '');
        if (typeof parseInt(row) == 'number') {
          row = '@' + row
        }else {
          if (symbolTable[row]) {
            row = '@'+symbolTable[row]
          }else{
            symbolTable[row] = counter;
            row = '@'+ counter
            counter++;
          }
        }
        //check and edit var names
      }
      lineCommands.push(row.replace('\r', ''));
    }
  }
  console.log(lineCommands);
  //create binary code for each command
  lineCommands.forEach((command) => {
    asmToBinary(command)
  })
  //write commands to file
  var hackFile = fileName.replace('asm', 'hack');
  fs.writeFile(hackFile, binaryCommands, (err) => {
    if(err) throw err;
    console.log(hackFile, 'has been written');
  })
}

function read(fileName){
  fs.readFile(fileName, 'utf8', (err, data) => {
    var dataNoComments = data.replace(/\/\/.*/g, '').trim().replace(/[\t\f\v ]*/g, '');
    console.log(dataNoComments);
    Assemble(dataNoComments, fileName);
  })
}

// read(add);
read(max);
// read(pong);
// read(rect);
