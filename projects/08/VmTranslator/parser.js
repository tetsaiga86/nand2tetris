var AddSubAndOr = '@SP\nAM=M-1\nD=M\nA=A-1\n';
var jumpFlag=0;
var labelCount=0;

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

function preFrameTemplate(type){
  return `@R11\nD=M-1\nAM=D\nD=M\n@${type}\nM=D\n`;
}

function callTemplate(name, numOfArgs){
  //push return address,LCL,ARG,THIS,THAT,and then call
  var newLabel = "RETURN_LABEL" + (labelCount++);
  var commandString = `@${newLabel}\nD=A\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`
                  .concat(pushTemplate("LCL",0,true))
                  .concat(pushTemplate("ARG",0,true))
                  .concat(pushTemplate("THIS",0,true))
                  .concat(pushTemplate("THAT",0,true))
                  .concat(`@SP\nD=M\n@5\nD=D-A\n@${numOfArgs}\nD=D-A\n@ARG\nM=D\n@SP\nD=M\n@LCL\nM=D\n@${name}\n0;JMP\n(${newLabel})\n`);
  return commandString;
}

function functionTemplate(name, numLocals){
  var commandString = (`(${name})\n`);
  for (var i = 0; i < numLocals; i++){
    commandString = commandString.concat(pushPopStrings('push','constant',i));
  }
  return commandString;
}

export default function parseCommand(command){
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
    case 'goto':
      commandString = `@${segment}\n0;JMP\n`;
      break;
    case 'if-goto':
      commandString = `${AddSubAndOr}@${segment}\nD;JNE\n`;
      break;
    case 'label':
      commandString = `(${segment})\n`;
      break;
    case 'call':
      commandString = callTemplate(segment, index);
      break;
    case 'function':
      commandString = functionTemplate(segment, index);
      break;
    case 'return':
      commandString = `@LCL\nD=M\n@R11\nM=D\n@5\nA=D-A\nD=M\n@R12\nM=D\n${popTemplate("ARG",0,false)}@ARG\nD=M\n@SP\nM=D+1\n${preFrameTemplate("THAT")}${preFrameTemplate("THIS")}${preFrameTemplate("ARG")}${preFrameTemplate("LCL")}@R12\nA=M\n0;JMP\n`;
      break
  }
  return commandString;
}
