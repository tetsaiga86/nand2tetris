import read from './read.js';
import xml from 'xml-parse'
var tokens = [];
var nestedObject = {};

function compileClass(){
}

function compileClassVarDec(){
}

function compileSubroutine(){
}

function compileParameterList(){
}

function compileVarDec(){
}

function compileStatements(){
}

function compileDo(){
}

function compileLet(){
}

function compileWhile(){
}

function compileReturn(){
}

function compileIf(){
}

function compileExpression(){
}

function compileTerm(){
}

function compileExpressionList(){
}



function buildNestedObject(tokenObj, parent){
  switch (tokenObj.innerXML.trim()) {
    case 'class':
      compileClass(parent);
      break;
    default:

  }
}

export default function compile(tokenFile){
  tokens = read(tokenFile);
  for (var i = 1; i < tokens.length-1; i++) {
    buildNestedObject(xml.parse(tokens[i])[0], nestedObject);
  }
  console.log(nestedObject);
}
