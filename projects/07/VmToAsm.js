var fs = require('fs');
var basic = './MemoryAccess/BasicTest/BasicTest.vm';
var pointer = './MemoryAccess/PointerTest/PointerTest.vm';
var staticc = './MemoryAccess/StaticTest/StaticTest.vm';
var add = './StackArithmetic/SimpleAdd/SimpleAdd.vm';
var stack = './StackArithmetic/StackTest/StackTest.vm';
var AddSubAndOr = '@SP\nAM=M-1\nD=M\nA=A-1\n';
var jumpFlag;

function write(fileName, parsedCommands){
  var newFile = fileName.replace('vm', 'asm');
  var newFileString = ''
  parsedCommands.forEach((command) => {
    newFileString += command.concat('\n');
  })
  fs.writeFile(newFile, newFileString, (err) => {
    if(err) throw err;
    console.log(newFile, 'has been written');
  })
}

function pushTemplate(segment, index, isDirect){
  var noPointerCode = isDirect ? '' : `@${index}\nA=D+A\nD=M\n`;
  return `@${segment}\nD=M\n${noPointerCode}@SP\nA=M\nM=D\n@SP\nM=M+1\n`
}

function popTemplate(segment, index, isDirect){
  var noPointerCode = isDirect ? 'D=A\n' : `D=M\n@${index}\nD=D+A\n`;
  return `@${segment}\n${noPointerCode}@R13\nM=D\n@SP\nAM=M-1\nD=M\n@R13\nA=M\nM=D\n`;
}

function pushPopStrings(command, segment, index){
  if (command=='push') {
    switch (segment) {
    case 'local':
      return pushTemplate('LCL',index,false);
      break;
    case 'argument':
      return pushTemplate('ARG',index,false);
      break;
    case 'this':
      return pushTemplate('THIS',index,false);
      break;
    case 'that':
      return pushTemplate('THAT',index,false);
      break;
    case 'constant':
      return `@${index}\nD=A\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`
      break;
    case 'static':
      return pushTemplate((parseInt(index)+16).toString(), index, true);
      break;
    case 'pointer':
      if (index==0) {
        return pushTemplate('THIS', index, true);
      } else {
        return pushTemplate('THAT', index, true);
      }
      break;
    case 'temp':
      return pushTemplate("R5", (parseInt(index)+5).toString(),false);
      break;
    }
  } else {
    switch (segment) {
    case 'local':
      return popTemplate('LCL',index,false);
      break;
    case 'argument':
      return popTemplate('ARG',index,false);
      break;
    case 'this':
      return popTemplate('THIS',index,false);
      break;
    case 'that':
      return popTemplate('THAT',index,false);
      break;
    case 'constant':
      return `@${index}\nD=A\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`
      break;
    case 'static':
      return popTemplate((parseInt(index)+16).toString(), index, true);
      break;
    case 'pointer':
      if (index==0) {
        return popTemplate('THIS', index, true);
      } else {
        return popTemplate('THAT', index, true);
      }
      break;
    case 'temp':
      return popTemplate("R5", (parseInt(index)+5).toString(),false);
      break;
    }
  }

}

function compareTemplate(type){
  return `@SP\nAM=M-1\nD=M\nA=A-1\nD=M-D\n@FALSE${jumpFlag}\nD;${type}\n@SP\nA=M-1\nM=-1\n@CONTINUE${jumpFlag}\n0;JMP\n(FALSE${jumpFlag})\n@SP\nA=M-1\nM=0\n(CONTINUE${jumpFlag})\n`;
}

function parseCommand(command){
  var commandString = '';
  commandSplitArr = command.split(' ');
  var segment = commandSplitArr[1];
  var index = commandSplitArr[2];
  switch (commandSplitArr[0]) {
    case 'add':
      commandString = commandString.concat(AddSubAndOr+'M=M+D\n');
      break;
    case 'sub':
      commandString = commandString.concat(AddSubAndOr+'M=M-D\n');
      break;
    case 'neg':
      commandString = commandString.concat('D=0\n@SP\nA=M-1\nM=D-M\n');
      break;
    case 'eq':
      commandString = commandString.concat(compareTemplate('JNE'));
      jumpFlag++;
      break;
    case 'gt':
      commandString = commandString.concat(compareTemplate('JLE'));
      jumpFlag++;
      break;
    case 'lt':
      commandString = commandString.concat(compareTemplate('JGE'));
      jumpFlag++;
      break;
    case 'and':
      commandString = commandString.concat(AddSubAndOr+'M=M&D\n');
      break;
    case 'or':
      commandString = commandString.concat(AddSubAndOr+'M=M|D\n');
      break;
    case 'not':
      commandString = commandString.concat('@SP\nA=M-1\nM=!M\n');
      break;
    case 'pop':
      commandString = commandString.concat(pushPopStrings('pop', segment, index));
      break;
    case 'push':
      commandString = commandString.concat(pushPopStrings('push', segment, index));
      break;
  }
  return commandString;
}

function parseCommands(commandsArr){
  var parsedCommandsArr = [];
  commandsArr.forEach((command) => {
    parsedCommandsArr.push(`// ${command}`);
    parsedCommandsArr.push(parseCommand(command));
  })
  return parsedCommandsArr;
}

function read(fileName){
  jumpFlag = 0;
  var commands;
  fs.readFile(fileName, 'utf8', (err, data)=>{
    commands = data.replace(/\/\/.*|[\t\f\r]*/g, '').trim().split('\n');
    write(fileName, parseCommands(commands));
  })
}

read(basic);
read(pointer);
read(staticc);
read(add);
read(stack);
