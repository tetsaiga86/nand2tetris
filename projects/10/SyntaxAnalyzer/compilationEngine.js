import read from './read.js';
import xml from 'xml-parse';
import write from './write.js';
var tokens = [];
var nestedObject = {};
var currentToken,
    currentTokenIdx,
    tokenType,
    tokenText,
    outputString = '';
var operators = ['+', '-', '*', '/', '&amp', '|', '&lt;', '&gt;', '='];

function isOp(string){
  if (operators.indexOf(string)>=0) {
    return true;
  }
  return false;
}

function advance(){
  currentTokenIdx += 1;
  currentToken = xml.parse(tokens[currentTokenIdx])[0];
  tokenType = currentToken.tagName;
  tokenText = currentToken.innerXML.trim();
}

function pointerBack(){
  currentTokenIdx -= 1;
  currentToken = xml.parse(tokens[currentTokenIdx])[0];
  tokenType = currentToken.tagName;
  tokenText = currentToken.innerXML.trim();
}

function requireSymbol(symbol){
  advance();
  if (tokenType == 'symbol' && tokenText == symbol) {
    outputString = outputString.concat(`<symbol>${symbol}</symbol>\n`)
  }else {
    console.log(outputString.split('\n').length, outputString);
    throw new Error(`tokenType = ${tokenType} and should = symbol, tokenText = ${tokenText} and should = ${symbol}`);
  }
}

function compileType(){
  advance();
  var isType = false;

  if(tokenType == 'keyword' && (tokenText == 'int' || tokenText == 'char' || tokenText == 'boolean')) {
    outputString = outputString.concat(`<keyword>${tokenText}</keyword>\n`);
    isType = true;
  }

  if(tokenType == 'identifier'){
    outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);
    isType = true;
  }

  if (!isType) throw new Error("int|char|boolean|className");
}

function compileExpression(){
  outputString = outputString.concat('<expression>\n');

  //term
  compileTerm();

  //(op term)*
  var moreTerms = true;
  while (moreTerms) {
    advance();

    //op
    if (tokenType == 'symbol' && isOp(tokenText)){
      if (tokenText == '&gt;'){
        outputString = outputString.concat('<symbol>&gt;</symbol>\n');
      }else if (tokenText == '&lt;'){
        outputString = outputString.concat('<symbol>&lt;</symbol>\n');
      }else if (tokenText == '&amp;') {
        outputString = outputString.concat('<symbol>&amp;</symbol>\n');
      }else {
        outputString = outputString.concat(`<symbol>${tokenText}</symbol>\n`);
      }

      //term
      compileTerm();
    }else {
      pointerBack();
      moreTerms = false;
    }
  }

  outputString = outputString.concat('</expression>\n');
}

function compileExpressionList(){
  advance();

  //determine if there is any expression, if next is ')' then no
  if (tokenType == 'symbol' && tokenText == ')'){
    pointerBack();
  }else {
    pointerBack();

    //expression
    compileExpression();

    //(','expression)*
    var moreExpressions = true;
    while (moreExpressions) {
      advance();
      if (tokenType == 'symbol' && tokenText == ',') {
        outputString = outputString.concat('<symbol>,</symbol>\n');
        compileExpression();
      } else {
        pointerBack();
        moreExpressions = false;
      }
    }
  }
}

function compileSubroutineCall(){
  advance();
  if (tokenType != 'identifier'){
    throw new Error('identifier');
  }
  outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

  advance();
  if (tokenType == 'symbol' && tokenText == '('){
    //'(' expressionList ')'
    outputString = outputString.concat('<symbol>(</symbol>\n');

    //expressionList
    outputString = outputString.concat("<expressionList>\n");
    compileExpressionList();
    outputString = outputString.concat("</expressionList>\n");

    //')'
    requireSymbol(')');
  }else if (tokenType == 'symbol' && tokenText == '.'){
    //(className|varName) '.' subroutineName '(' expressionList ')'
    outputString = outputString.concat("<symbol>.</symbol>\n");

    //subroutineName
    advance();
    if (tokenType != 'identifier'){
      throw new Error("identifier");
    }
    outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

    //'('
    requireSymbol('(');

    //expressionList
    outputString = outputString.concat("<expressionList>\n");
    compileExpressionList();
    outputString = outputString.concat("</expressionList>\n");

    //')'
    requireSymbol(')');
  }else {
    throw new Error('( | .');
  }
}

function compileTerm(){
  outputString = outputString.concat('<term>\n')
  advance();

  //check if it is an identifier
  if (tokenType == 'identifier'){
    //varName|varName '[' expression ']'|subroutineCall
    var tempId = tokenText;

    advance();
    if (tokenType == 'symbol' && tokenText == '['){
      outputString = outputString.concat(`<identifier>${tempId}</identifier>\n`);

      //this is an array entry
      outputString = outputString.concat('<symbol>[</symbol>\n');

      //expression
      compileExpression();

      //']'
      requireSymbol(']');
    }else if (tokenType == 'symbol' && (tokenText == '(' || tokenText == '.')){
      //this is a subroutineCall
      pointerBack();
      pointerBack();
      compileSubroutineCall();
    }else{
      outputString = outputString.concat(`<identifier>${tempId}</identifier>\n`);

      //this is varName
      pointerBack();
    }
  }else{
    //integerConstant|stringConstant|keywordConstant|'(' expression ')'|unaryOp term
    if (tokenType == 'integerConstant'){
      outputString = outputString.concat(`<integerConstant>${tokenText}</integerConstant>\n`);
    }else if (tokenType == 'stringConstant'){
      outputString = outputString.concat(`<stringConstant>${tokenText}</stringConstant>\n`);
    }else if(tokenType== 'keyword' &&
            (tokenText == 'true' ||
            tokenText == 'false' ||
            tokenText == 'null' ||
            tokenText == 'this')){
      outputString = outputString.concat(`<keyword>${tokenText}</keyword>\n`);
    }else if (tokenType == 'symbol' && tokenText == '('){
      outputString = outputString.concat('<symbol>(</symbol>\n');

      //expression
      compileExpression();

      //')'
      requireSymbol(')');
    }else if (tokenType == 'symbol' && (tokenText == '-' || tokenText == '~')){
      outputString = outputString.concat(`<symbol>${tokenText}</symbol>\n`);

      //term
      compileTerm();
    }else {
      throw new Error("integerConstant|stringConstant|keywordConstant|'(' expression ')'|unaryOp term");
    }
  }

  outputString = outputString.concat('</term>\n');
}

function compileDo(){
  outputString = outputString.concat('<doStatement>\n<keyword>do</keyword>\n');

  //subroutineCall
  compileSubroutineCall();

  //';'
  requireSymbol(';');
  outputString = outputString.concat('</doStatement>\n');
}

function compileLet(){
  outputString = outputString.concat('<letStatement>\n<keyword>let</keyword>\n');

  //varName
  advance();
  if (tokenType != 'identifier'){
    throw new Error("varName");
  }
  outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);


  //'[' or '='
  advance();
  if (tokenType != 'symbol' || (tokenText != '[' && tokenText != '=')){
    throw new Error("'['|'='");
  }

  var expExist = false;

  //'[' expression ']'
  if (tokenText == '['){
    expExist = true;
    outputString = outputString.concat('<symbol>[</symbol>\n');
    compileExpression();

    //']'
    advance();
    if (tokenType == 'symbol' && tokenText == ']'){
      outputString = outputString.concat('<symbol>]</symbol>\n');
    }else {
      throw new Error("']'");
    }
  }

  if(expExist) advance();

  //'='
  outputString = outputString.concat('<symbol>=</symbol>\n');

  //expression
  compileExpression();

  //';'
  requireSymbol(';');

  outputString = outputString.concat('</letStatement>\n');
}

function compileWhile(){
  outputString = outputString.concat('<whileStatement>\n<keyword>while</keyword>\n');

  //'('
  requireSymbol('(');

  //expression
  compileExpression();

  //')'
  requireSymbol(')');

  //'{'
  requireSymbol('{');

  //statements
  outputString = outputString.concat('<statements>\n');
  compileStatements();
  outputString = outputString.concat('</statements>\n');

  //'}'
  requireSymbol('}');

  outputString = outputString.concat('</whileStatement>\n');
}

function compileReturn(){
  outputString = outputString.concat('<returnStatement>\n<keyword>return</keyword>\n');

  //check if there is any expression
  advance();
  //no expression
  if (tokenType == 'symbol' && tokenText == ';'){
    outputString = outputString.concat('<symbol>;</symbol>\n</returnStatement>\n')
    return;
  }

  pointerBack();
  //expression
  compileExpression();
  //';'
  requireSymbol(';');

  outputString = outputString.concat('</returnStatement>\n');
}

function compileIf(){
  outputString = outputString.concat('<ifStatement>\n<keyword>if</keyword>\n')

  //'('
  requireSymbol('(');

  //expression
  compileExpression();

  //')'
  requireSymbol(')');

  //'{'
  requireSymbol('{');

  //statements
  outputString = outputString.concat('<statements>\n');
  compileStatements();
  outputString = outputString.concat('</statements>\n');

  //'}'
  requireSymbol('}');

  //check if there is 'else'
  advance();
  if (tokenType == 'keyword' && tokenText == 'else'){
    outputString = outputString.concat('<keyword>else</keyword>\n')

    //'{'
    requireSymbol('{');

    //statements
    outputString = outputString.concat('<statements>\n');
    compileStatements();
    outputString = outputString.concat('</statements>\n');

    //'}'
    requireSymbol('}');
  }else {
    pointerBack();
  }

  outputString = outputString.concat('</ifStatement>\n');
}

function compileVarDec(){
  //determine if there is a varDec

  advance();
  //no 'var' go back
  if (tokenType != 'keyword' || tokenText != 'var'){
      pointerBack();
      return;
  }

  outputString = outputString.concat('<varDec>\n<keyword>var</keyword>\n')

  //type
  compileType();

  //at least one varName
  var moreVarNames = true;

  while (moreVarNames) {
    //varName
    advance();
    if (tokenType != 'identifier') {
      throw new Error('identifier');
    }
    outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

    //',' or ';'
    advance();
    if (tokenType != 'symbol' || (tokenText != ',' && tokenText != ';')) {
      throw new Error(', or ;')
    }
    if (tokenText == ',') {
      outputString = outputString.concat(`<symbol>,</symbol>\n`);
    } else {
      outputString = outputString.concat(`<symbol>;</symbol>\n`);
      moreVarNames = false;
    }
  }

  outputString = outputString.concat(`</varDec>\n`);
  compileVarDec();
}

function compileStatements(){
  //determine whether there is a statementnext can be a '}'
  advance();

  //next is a '}'
  if (tokenType == 'symbol' && tokenText == '}'){
     pointerBack();
     return;
  }

  //next is 'let'|'if'|'while'|'do'|'return'
  if (tokenType != 'keyword') {
    throw new Error('keyword');
  } else {
    switch (tokenText) {
      case 'let':
        compileLet();
        break;
      case 'if':
        compileIf();
        break;
      case 'while':
        compileWhile();
        break;
      case 'do':
        compileDo();
        break;
      case 'return':
        compileReturn();
        break;
      default:
        throw new Error('let|if|while|do|return');
    }
  }

  compileStatements();
}

function compileParameterList(){
  //check if there is parameterList, if next token is ')' than go back
  advance();
  if (tokenType == 'symbol' && tokenText == ')') {
    pointerBack();
    return;
  }

  //there is parameter, at least one varName
  pointerBack();
  var moreParameters = true;
  while (moreParameters) {
    //type
    compileType();

    //varName
    advance();
    if (tokenType != 'identifier'){
      throw new Error('identifier');
    }
    outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

    //',' or ')'
    advance();
    if (tokenType != 'symbol' || (tokenText != ',' && tokenText != ')')){
      throw new Error(', or )');
    }
    if (tokenText == ',') {
      outputString = outputString.concat('<symbol>,</symbol>\n');
    } else {
      pointerBack();
      moreParameters = false;
    }
  }
}

function compileSubroutineBody(){
  outputString = outputString.concat('<subroutineBody>\n')

  //'{'
  requireSymbol('{');

  //varDec*
  compileVarDec();

  //statements
  outputString = outputString.concat('<statements>\n')
  compileStatements();
  outputString = outputString.concat('</statements>\n')

  //'}'
  requireSymbol('}');
  outputString = outputString.concat('</subroutineBody>\n')
}

function compileSubroutine(){
  //determine whether there is a subroutine, next can be a '}'
  advance();

  //next is a '}'
  if (tokenType == 'symbol' && tokenText == '}') {
    pointerBack();
    return;
  }

  //start of a subroutine
  if (tokenType != 'keyword' || (tokenText != 'constructor' && tokenText != 'function' && tokenText != 'method')) {
    throw new Error('constructor|function|method');
  }
  outputString = outputString.concat(`<subroutineDec>\n<keyword>${tokenText}</keyword>\n`)

  //'void' or type
  advance();
  if (tokenType == 'keyword' && tokenText == 'void') {
    outputString = outputString.concat('<keyword>void</keyword>\n');
  } else {
    pointerBack();
    compileType();
  }

  //subroutineName which is a identifier
  advance();
  if (tokenType != 'identifier') {
    throw new Error('subroutineName');
  }
  outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`)

  //'('
  requireSymbol('(');

  //parameterList
  outputString = outputString.concat('<parameterList>\n');
  compileParameterList();
  outputString = outputString.concat('</parameterList>\n');

  //')'
  requireSymbol(')');

  //subroutineBody
  compileSubroutineBody();
  outputString = outputString.concat('</subroutineDec>\n');

  compileSubroutine();
}

function compileClassVarDec(){
  //first determine whether there is a classVarDec, nextToken is } or start subroutineDec
  advance();

  //next is a '}'
  if (tokenType == 'symbol' && tokenText == '}'){
      pointerBack();
      return;
  }

  //next is start subroutineDec or classVarDec, both start with keyword
  if (tokenType != 'keyword'){
      throw new Error('Keywords');
  }

  //next is subroutineDec
  if (tokenText == 'constructor' || tokenText == 'function' || tokenText== 'method') {
    pointerBack();
    return;
  }

  outputString = outputString.concat('<classVarDec>\n');

  //classVarDec exists
  if (tokenText != 'static' && tokenText != 'field') {
    throw new Error('static or field');
  }
  outputString = outputString.concat(`<keyword>${tokenText}</keyword>\n`)

  //type
  compileType();

  var moreVarNames = true;

  while (moreVarNames) {
    //varName
    advance();
    if (tokenType != 'identifier') {
      throw new Error('identifier');
    }
    outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

    // , or ;
    advance();
    if (tokenType != 'symbol' || (tokenText != ',' && tokenText != ';')) {
      throw new Error(`, or ;`);
    }
    if (tokenText == ',') {
      outputString = outputString.concat(`<symbol>,</symbol>\n`);
    } else {
      outputString = outputString.concat(`<symbol>;</symbol>\n`);
      moreVarNames = false;
    }
  }

  outputString = outputString.concat(`</classVarDec>\n`)

  compileClassVarDec();
}

function compileClass(){
  //'class'
  advance();
  if (tokenType != 'keyword' || tokenText != 'class') {
    throw new Error('class');
  }
  outputString = outputString.concat('<class>\n<keyword>class</keyword>\n')

  //className
  advance();
  if (tokenType != 'identifier') {
    throw new Error('className');
  }
  outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`)

  //'{'
  requireSymbol('{');

  //classVarDec* subroutineDec*
  compileClassVarDec();
  compileSubroutine();

  //'}'
  requireSymbol('}');

  //check that there are no more tokens
  if(currentTokenIdx != tokens.length-2){
    throw new Error("Unexpected tokens");
  }
  //finish outputString
  outputString = outputString.concat('</class>\n');

}

export default function compile(tokenFile){
  tokens = read(tokenFile);
  currentTokenIdx = 0;
  compileClass();
  var outputFile = tokenFile.replace(`T.xml`, '.xml');
  write(outputFile, outputString);
}
