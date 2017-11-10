import fs from 'fs';
import read from './read.js';
import makeRegex from './regex.js';
import write from './write.js';
const escapeStringRegexp = require('escape-string-regexp');

const keywords = ['class', 'constructor', 'function', 'method', 'field',
  'static', 'var', 'int', 'char', 'boolean', 'void', 'true', 'false',
  'null', 'this', 'let', 'do', 'if', 'else', 'while', 'return'];

const symbol = ['{', '}', '(', ')', '[', ']', '.', ',', ';', '+', '-',
  '*', '/', '&', '|', '<', '>', '=', '~'];

// console.log(makeRegex(keywords));
var keywordsRegex = makeRegex(keywords.map((keyword) => new RegExp(keyword)));
var symbolsRegex = makeRegex(symbol.map(escapeStringRegexp).map((escapedSymbol) => new RegExp(escapedSymbol)));
var intConstantRegex = /[0-9]+/;
var stringConstantRegex = /".*"/;
var identifierRegex = /[a-zA-Z_][0-9a-zA-Z_]*/;
var tokenizerRegex = makeRegex([keywordsRegex, symbolsRegex, intConstantRegex, stringConstantRegex, identifierRegex]);

String.prototype.isMatch = function(s){
   return this.match(s)!==null
}

function makeTokenString(arr){
  var tokenString = '';
  arr.forEach((item) => {
    switch (true) {
      case item.isMatch(keywordsRegex):
        tokenString = tokenString.concat(convertKeywordToXml(item)+'\n');
        break;
      case item.isMatch(symbolsRegex):
        tokenString = tokenString.concat(convertSymbolToXml(item)+'\n');
        break;
      case item.isMatch(intConstantRegex):
        tokenString = tokenString.concat(`<integerConstant> ${item} </integerConstant>\n`);
        break;
      case item.isMatch(stringConstantRegex):
        tokenString = tokenString.concat(`<stringConstant> ${item.replace(/"/g, '')} </stringConstant>\n`);
        break;
      case item.isMatch(identifierRegex):
        tokenString = tokenString.concat(`<identifier> ${item} </identifier>\n`);
        break;
    }
  })
  return tokenString;
}

function convertKeywordToXml(keyword) {
  return `<keyword> ${keyword} </keyword>`;
}

function convertSymbolToXml(symbol){
  switch (symbol) {
    case '<':
      return `<symbol> &lt; </symbol>`
      break;
    case '>':
      return `<symbol> &gt; </symbol>`
      break;
    case '"':
      return `<symbol> &quot; </symbol>`
      break;
    case '&':
      return `<symbol> &amp; </symbol>`
      break;
    default:
      return `<symbol> ${symbol} </symbol>`
  }
}

function getJackFiles(dir){
  var files = fs.readdirSync(dir),
      jackFiles = [];

  files.forEach((file) => {
    if(file.includes('.jack')) jackFiles.push(file);
  })
  return jackFiles;
}

function tokenizeFile(file){
  var code = read(file),
      tokenString = '<tokens>\n';
  code.forEach((line) => {
    var lineTokens = line.match(tokenizerRegex);
    // console.log(lineTokens);
    tokenString = tokenString.concat(makeTokenString(lineTokens))
  })
  tokenString = tokenString.concat('</tokens>\n');
  var newOutput = file.split('/');
  var length = newOutput.length;
  var folder = newOutput[length-2]
  newOutput = `./myOutputFiles/${folder}/${newOutput[length-1].replace('.jack', 'T.xml')}`;
  write(newOutput, tokenString);
}

export default function tokenize(name){
  var isDir = fs.lstatSync(name).isDirectory();

  if (isDir) {
    var jackFiles = getJackFiles(name);
    jackFiles.forEach((file) => {
      tokenizeFile(`${name}/${file}`);
    })
  } else {
    tokenizeFile(name)
  }
}
