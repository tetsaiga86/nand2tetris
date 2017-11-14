import read from './read.js';
import xml from 'xml-parse';
import SymbolTable from './symbolTable.js';

var tokens = [];
var currentToken,
    currentClass,
    currentSubroutine,
    currentTokenIdx,
    tokenType,
    tokenText,
    classSymbolTable,
    type,
    kind,
    labelIndex,
    outputString;
var operators = ['+', '-', '*', '/', '&amp;', '|', '&lt;', '&gt;', '='];

function isOp(string){
  if (operators.indexOf(string)>=0) {
    return true;
  }
  return false;
}

function newLabel(){
  return "LABEL_" + (labelIndex++);
}

function currentFunction(){
  if (currentClass.length != 0 && currentSubroutine.length !=0){
    return currentClass + "." + currentSubroutine;
  }

  return "";
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
    // outputString = outputString.concat(`<symbol>${symbol}</symbol>\n`)
  }else {
    console.error(outputString);
    console.error('tokenNumber', currentTokenIdx);
    throw new Error(`tokenType = ${tokenType} and should = symbol, tokenText = ${tokenText} and should = ${symbol}`);
  }
}

function compileType(){
  advance();
  // var isType = false;

  if(tokenType == 'keyword' && (tokenText == 'int' || tokenText == 'char' || tokenText == 'boolean')) {
    type = tokenText;
    // outputString = outputString.concat(`<keyword>${tokenText}</keyword>\n`);
    // isType = true;
    return currentToken;
  }

  if(tokenType == 'identifier'){
    type = tokenText;
    // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);
    return currentToken;
    // isType = true;
  }

  throw new Error("int|char|boolean|className");
}

function compileExpression(){
  // outputString = outputString.concat('<expression>\n');

  //term
  compileTerm();

  //(op term)*
  var moreTerms = true;
  while (moreTerms) {
    advance();

    //op
    if (tokenType == 'symbol' && isOp(tokenText)){
      // if (tokenText == '&gt;'){
      //   outputString = outputString.concat('<symbol>&gt;</symbol>\n');
      // }else if (tokenText == '&lt;'){
      //   outputString = outputString.concat('<symbol>&lt;</symbol>\n');
      // }else if (tokenText == '&amp;') {
      //   outputString = outputString.concat('<symbol>&amp;</symbol>\n');
      // }else {
      //   outputString = outputString.concat(`<symbol>${tokenText}</symbol>\n`);
      // }

      var opCmd = "";

      switch (tokenText){
          case '+':
            opCmd = "add";
            break;
          case '-':
            opCmd = "sub";
            break;
          case '*':
            opCmd = "call Math.multiply 2";
            break;
          case '/':
            opCmd = "call Math.divide 2";
            break;
          case '&lt;':
            opCmd = "lt";
            break;
          case '&gt;':
            opCmd = "gt";
            break;
          case '=':
            opCmd = "eq";
            break;
          case '&amp;':
            opCmd = "and";
            break;
          case '|':
            opCmd = "or";
            break;
          default:
            error("Unknown op!");
      }

      //term
      compileTerm();

      writeCommand(opCmd,"","");
    }else {
      pointerBack();
      moreTerms = false;
    }
  }

  // outputString = outputString.concat('</expression>\n');
}

function compileExpressionList(){
  var argNum = 0;
  advance();

  //determine if there is any expression, if next is ')' then no
  if (tokenType == 'symbol' && tokenText == ')'){
    pointerBack();
  }else {
    argNum = 1;
    pointerBack();

    //expression
    compileExpression();

    //(','expression)*
    var moreExpressions = true;
    while (moreExpressions) {
      advance();
      if (tokenType == 'symbol' && tokenText == ',') {
        // outputString = outputString.concat('<symbol>,</symbol>\n');
        compileExpression();
        argNum++;
      } else {
        pointerBack();
        moreExpressions = false;
      }
    }
  }
  return argNum;
}

function compileSubroutineCall(){
  advance();
  if (tokenType != 'identifier'){
    throw new Error('identifier');
  }
  // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

  var name = tokenText;
  var argNum = 0;

  advance();
  if (tokenType == 'symbol' && tokenText == '('){
    //push this pointer
    writePush('pointer', 0);

    //'(' expressionList ')'
    // outputString = outputString.concat('<symbol>(</symbol>\n');

    //expressionList
    // outputString = outputString.concat("<expressionList>\n");
    argNum = compileExpressionList()+1;
    // outputString = outputString.concat("</expressionList>\n");

    //')'
    requireSymbol(')');

    //call subroutine
    writeCall(currentClass + '.' + name, argNum);
  }else if (tokenType == 'symbol' && tokenText == '.'){
    //(className|varName) '.' subroutineName '(' expressionList ')'
    // outputString = outputString.concat("<symbol>.</symbol>\n");

    var objName = name;
    //subroutineName
    advance();
    if (tokenType != 'identifier'){
      throw new Error("identifier");
    }
    // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

    name = tokenText;

    //check for if it is built-in type
    type = classSymbolTable.typeOf(objName);

    if (type == "int"  || type == "boolean" || type == "char" || type == "void"){
      throw new Error("no built-in type");
    }else if (type == ""){
      name = objName + "." + name;
    }else {
      argNum = 1;
      //push variable directly onto stack
      writePush(getSeg(classSymbolTable.kindOf(objName)), classSymbolTable.indexOf(objName));
      name = classSymbolTable.typeOf(objName) + "." + name;
    }

    //'('
    requireSymbol('(');

    //expressionList
    // outputString = outputString.concat("<expressionList>\n");
    argNum += compileExpressionList();
    // outputString = outputString.concat("</expressionList>\n");

    //')'
    requireSymbol(')');

    //call subroutine
    writeCall(name, argNum);
  }else {
    throw new Error('( | .');
  }
}

function compileTerm(){
  // outputString = outputString.concat('<term>\n')
  advance();

  //check if it is an identifier
  if (tokenType == 'identifier'){
    //varName|varName '[' expression ']'|subroutineCall
    var tempId = tokenText;

    advance();
    if (tokenType == 'symbol' && tokenText == '['){
      // outputString = outputString.concat(`<identifier>${tempId}</identifier>\n`);

      //this is an array entry
      // outputString = outputString.concat('<symbol>[</symbol>\n');

      //push array variable,base address into stack
      writePush(getSeg(classSymbolTable.kindOf(tempId)), classSymbolTable.indexOf(tempId));

      //expression
      compileExpression();
      //']'
      requireSymbol(']');

      //base+offset
      writeArithmetic('add');

      //pop into 'that' pointer
      writePop('pointer', 1);
      //push *(base+index) onto stack
      writePush('that', 0);
    }else if (tokenType == 'symbol' && (tokenText == '(' || tokenText == '.')){
      //this is a subroutineCall
      pointerBack();
      pointerBack();
      compileSubroutineCall();
    }else{
      // outputString = outputString.concat(`<identifier>${tempId}</identifier>\n`);

      //this is varName
      pointerBack();
      //push variable directly onto stack
      writePush(getSeg(classSymbolTable.kindOf(tempId)), classSymbolTable.indexOf(tempId));
    }
  }else{
    //integerConstant|stringConstant|keywordConstant|'(' expression ')'|unaryOp term
    if (tokenType == 'integerConstant'){
      // outputString = outputString.concat(`<integerConstant>${tokenText}</integerConstant>\n`);

      //integerConstant just push its value onto stack
      writePush('constant', tokenText);
    }else if (tokenType == 'stringConstant'){
      // outputString = outputString.concat(`<stringConstant>${tokenText}</stringConstant>\n`);

      //stringConstant new a string and append every char to the new stack
      var str = tokenText;

      writePush('constant', str.length);
      writeCall("String.new", 1);

      for (var i = 0; i < str.length; i++){
        writePush('constant', str.charAt(i));
        writeCall("String.appendChar", 2);
      }

    // }else if(tokenType== 'keyword' &&
    //         (tokenText == 'true' ||
    //         tokenText == 'false' ||
    //         tokenText == 'null' ||
    //         tokenText == 'this')){
    //   outputString = outputString.concat(`<keyword>${tokenText}</keyword>\n`);
    // }else if (tokenType == 'symbol' && tokenText == '('){
    //   outputString = outputString.concat('<symbol>(</symbol>\n');
    //
    //   //expression
    //   compileExpression();
    //
    //   //')'
    //   requireSymbol(')');
    // }else if (tokenType == 'symbol' && (tokenText == '-' || tokenText == '~')){
    //   outputString = outputString.concat(`<symbol>${tokenText}</symbol>\n`);
    //
    //   //term
    //   compileTerm();
    // }else {
    //   throw new Error("integerConstant|stringConstant|keywordConstant|'(' expression ')'|unaryOp term");
    // }
    }else if(tokenType == 'keyword' && tokenText == 'true'){
      //~0 is true
      writePush('constant', 0);
      writeArithmetic('not');
    }else if(tokenType == 'keyword' && tokenText == 'this'){
      //push this pointer onto stack
      writePush('pointer', 0);
    }else if(tokenType == 'keyword' &&
            (tokenText == 'false' ||
            tokenText == 'null')){
      //0 for false and null
      writePush('constant',0);
    }else if (tokenType == 'symbol' && tokenText == '('){
      //expression
      compileExpression();
      //')'
      requireSymbol(')');
    }else if (tokenType == 'symbol' && (tokenText == '-' || tokenText == '~')){

      var s = tokenText;

      //term
      compileTerm();

      if (s == '-'){
          writeArithmetic('neg');
      }else {
        writeArithmetic('not');
      }

    }else {
      throw new Error("integerConstant|stringConstant|keywordConstant|'(' expression ')'|unaryOp term");
    }
  }
}

function compileDo(){
  // outputString = outputString.concat('<doStatement>\n<keyword>do</keyword>\n');

  //subroutineCall
  compileSubroutineCall();

  //';'
  requireSymbol(';');
  // outputString = outputString.concat('</doStatement>\n');
  writePop('temp', 0);
}

function compileLet(){
  // outputString = outputString.concat('<letStatement>\n<keyword>let</keyword>\n');

  //varName
  advance();
  if (tokenType != 'identifier'){
    throw new Error("varName");
  }
  // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

  var varName = tokenText;

  //'[' or '='
  advance();
  if (tokenType != 'symbol' || (tokenText != '[' && tokenText != '=')){
    throw new Error("'['|'='");
  }

  var expExist = false;

  //'[' expression ']'
  if (tokenText == '['){
    expExist = true;
    // outputString = outputString.concat('<symbol>[</symbol>\n');

    //push array variable,base address into stack
    writePush(getSeg(classSymbolTable.kindOf(varName)),classSymbolTable.indexOf(varName));

    //calc offset
    compileExpression();

    //']'
    requireSymbol(']');

    //base+offset
    writeArithmetic('add');
  }

  if(expExist) advance();

  //'='
  // outputString = outputString.concat('<symbol>=</symbol>\n');

  //expression
  compileExpression();

  //';'
  requireSymbol(';');

  // outputString = outputString.concat('</letStatement>\n');

  if (expExist){
    //*(base+offset) = expression
    //pop expression value to temp
    writePop('temp', 0);
    //pop base+index into 'that'
    writePop('pointer',1);
    //pop expression value into *(base+index)
    writePush('temp',0);
    writePop('that',0);
  } else {
    //pop expression value directly
    writePop(getSeg(classSymbolTable.kindOf(varName)), classSymbolTable.indexOf(varName));
  }
}

function compileWhile(){
  // outputString = outputString.concat('<whileStatement>\n<keyword>while</keyword>\n');

  var continueLabel = newLabel();
  var topLabel = newLabel();

  writeLabel(topLabel);
  //'('
  requireSymbol('(');

  //expression
  compileExpression();

  //')'
  requireSymbol(')');

  //if !(condition) go to continue label
  writeArithmetic('not');
  writeIf(continueLabel);

  //'{'
  requireSymbol('{');

  //statements
  // outputString = outputString.concat('<statements>\n');
  compileStatements();
  // outputString = outputString.concat('</statements>\n');

  //'}'
  requireSymbol('}');

  // outputString = outputString.concat('</whileStatement>\n');
  //if (condition) go to top label
  writeGoto(topLabel);
  //or continue
  writeLabel(continueLabel);
}

function compileReturn(){
  // outputString = outputString.concat('<returnStatement>\n<keyword>return</keyword>\n');

  //check if there is any expression
  advance();
  //no expression
  if (tokenType == 'symbol' && tokenText == ';'){
    // outputString = outputString.concat('<symbol>;</symbol>\n</returnStatement>\n')
    writePush('constant', 0);
  } else {
    pointerBack();
    //expression
    compileExpression();
    //';'
    requireSymbol(';');
  }
  writeReturn();
  // outputString = outputString.concat('</returnStatement>\n');
}

function compileIf(){
  // outputString = outputString.concat('<ifStatement>\n<keyword>if</keyword>\n')
  var elseLabel = newLabel();
  var endLabel = newLabel();

  //'('
  requireSymbol('(');

  //expression
  compileExpression();

  //')'
  requireSymbol(')');

  writeArithmetic('not');
  writeIf(elseLabel);

  //'{'
  requireSymbol('{');

  //statements
  // outputString = outputString.concat('<statements>\n');
  compileStatements();
  // outputString = outputString.concat('</statements>\n');

  //'}'
  requireSymbol('}');

  //if condition after statement finishing, go to end label
  writeGoto(endLabel);
  writeLabel(elseLabel);

  //check if there is 'else'
  advance();
  if (tokenType == 'keyword' && tokenText == 'else'){
    // outputString = outputString.concat('<keyword>else</keyword>\n')

    //'{'
    requireSymbol('{');

    //statements
    // outputString = outputString.concat('<statements>\n');
    compileStatements();
    outputString = outputString.concat('</statements>\n');

    //'}'
    requireSymbol('}');
  }else {
    pointerBack();
  }

  writeLabel(endLabel);
  // outputString = outputString.concat('</ifStatement>\n');
}

function compileVarDec(){
  //determine if there is a varDec

  advance();
  //no 'var' go back
  if (tokenType != 'keyword' || tokenText != 'var'){
      pointerBack();
      return;
  }

  // outputString = outputString.concat('<varDec>\n<keyword>var</keyword>\n')

  //type
  type = compileType();

  //at least one varName
  var moreVarNames = true;

  while (moreVarNames) {
    //varName
    advance();
    if (tokenType != 'identifier') {
      throw new Error('identifier');
    }
    // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

    classSymbolTable.define(tokenText, type, 'var');

    //',' or ';'
    advance();
    if (tokenType != 'symbol' || (tokenText != ',' && tokenText != ';')) {
      throw new Error(', or ;');
    }
    if (tokenText == ',') {
      // outputString = outputString.concat(`<symbol>,</symbol>\n`);
    } else {
      // outputString = outputString.concat(`<symbol>;</symbol>\n`);
      moreVarNames = false;
    }
  }

  // outputString = outputString.concat(`</varDec>\n`);
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
    type = compileType();

    //varName
    advance();
    if (tokenType != 'identifier'){
      throw new Error('identifier');
    }
    // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

    classSymbolTable.define(tokenText, type, 'arg');

    //',' or ')'
    advance();
    if (tokenType != 'symbol' || (tokenText != ',' && tokenText != ')')){
      throw new Error(', or )');
    }
    if (tokenText == ',') {
      // outputString = outputString.concat('<symbol>,</symbol>\n');
    } else {
      pointerBack();
      moreParameters = false;
    }
  }
}

function compileSubroutineBody(keyword){
  // outputString = outputString.concat('<subroutineBody>\n')

  //'{'
  requireSymbol('{');

  //varDec*
  compileVarDec();

  //write VM function declaration
  writeFunctionDec(keyword);

  //statements
  // outputString = outputString.concat('<statements>\n')
  compileStatements();
  // outputString = outputString.concat('</statements>\n')

  //'}'
  requireSymbol('}');
  // outputString = outputString.concat('</subroutineBody>\n')
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
  // outputString = outputString.concat(`<subroutineDec>\n<keyword>${tokenText}</keyword>\n`)
  var keyword = tokenText;
  classSymbolTable.startSubroutine();
  //for method this is the first argument
  if (tokenText == 'method'){
    classSymbolTable.define("this", currentClass, 'arg');
  }


  //'void' or type
  advance();
  if (tokenType == 'keyword' && tokenText == 'void') {
    // outputString = outputString.concat('<keyword>void</keyword>\n');
    type = 'void';
  } else {
    pointerBack();
    type = compileType();
  }

  //subroutineName which is a identifier
  advance();
  if (tokenType != 'identifier') {
    throw new Error('subroutineName');
  }
  // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`)

  currentSubroutine = tokenText;

  //'('
  requireSymbol('(');

  //parameterList
  // outputString = outputString.concat('<parameterList>\n');
  compileParameterList();
  // outputString = outputString.concat('</parameterList>\n');

  //')'
  requireSymbol(')');

  //subroutineBody
  compileSubroutineBody(keyword);
  // outputString = outputString.concat('</subroutineDec>\n');

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

  // outputString = outputString.concat('<classVarDec>\n');

  //classVarDec exists
  if (tokenText != 'static' && tokenText != 'field') {
    throw new Error('static or field');
  }
  kind = tokenText;
  // outputString = outputString.concat(`<keyword>${tokenText}</keyword>\n`)

  //type
  compileType();

  var moreVarNames = true;

  while (moreVarNames) {
    //varName
    advance();
    if (tokenType != 'identifier') {
      throw new Error('identifier');
    }
    classSymbolTable.define(tokenText, type, kind);
    // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`);

    // , or ;
    advance();
    if (tokenType != 'symbol' || (tokenText != ',' && tokenText != ';')) {
      throw new Error(`, or ;`);
    }
    if (tokenText == ',') {
      // outputString = outputString.concat(`<symbol>,</symbol>\n`);
    } else {
      // outputString = outputString.concat(`<symbol>;</symbol>\n`);
      moreVarNames = false;
    }
  }

  // outputString = outputString.concat(`</classVarDec>\n`)

  compileClassVarDec();
}

function compileClass(){
  //'class'
  advance();
  if (tokenType != 'keyword' || tokenText != 'class') {
    throw new Error('class');
  }

  //create class SymbolTable
  classSymbolTable = new SymbolTable();

  // outputString = outputString.concat('<class>\n<keyword>class</keyword>\n')

  //className
  advance();
  if (tokenType != 'identifier') {
    throw new Error('className');
  }
  // outputString = outputString.concat(`<identifier>${tokenText}</identifier>\n`)
  currentClass = tokenText;
  //'{'
  requireSymbol('{');

  //classVarDec* subroutineDec*
  compileClassVarDec();
  compileSubroutine();

  //'}'
  requireSymbol('}');

  //check that there are no more tokens
  if(currentTokenIdx != tokens.length-3){
    throw new Error("Unexpected tokens");
  }
  //finish outputString
  // outputString = outputString.concat('</class>\n');

}

//write functions
function writePush(segment, index){
  writeCommand("push", segment, index.toString());
}

function writeFunctionDec(keyword){

  writeFunction(currentFunction(),classSymbolTable.varCount('var'));

  //METHOD and CONSTRUCTOR need to load this pointer
  if (keyword == 'method'){
      //A Jack method with k arguments is compiled into a VM function that operates on k + 1 arguments.
      // The first argument (argument number 0) always refers to the this object.
      writePush('arg', 0);
      writePop('pointer', 0);

  }else if (keyword == 'constructor'){
      //A Jack function or constructor with k arguments is compiled into a VM function that operates on k arguments.
      writePush('constant', classSymbolTable.varCount('field'));
      writeCall("Memory.alloc", 1);
      writePop('pointer',0);
  }
}

function writePop(segment, index){
  writeCommand("pop", segment, index.toString());
}

function writeArithmetic(command){
  writeCommand(command, "", "");
}

function writeLabel(label){
  writeCommand("label",label,"");
}

function writeGoto(label){
  writeCommand("goto", label, "");
}

function writeIf(label){
  writeCommand("if-goto", label, "");
}

function writeCall(name, argNum){
  writeCommand("call", name, argNum.toString());
}

function writeFunction(name, localNum){
  writeCommand("function", name, localNum.toString());
}

function writeReturn(){
  writeCommand("return", "", "");
}

function writeCommand(cmd, arg1, arg2){
  outputString = outputString.concat(`${cmd} ${arg1} ${arg2}\n`);
}

function getSeg(kind){
  switch (kind){
    case 'field':
      return 'this';
    case 'static':
      return 'static';
    case 'var':
      return 'local';
    case 'arg':
      return 'argument';
    default:
      return 'none';
  }
}

export default function compile(inputTokens){
  tokens = inputTokens;
  outputString = '';
  currentTokenIdx = 0;
  labelIndex = 0;
  compileClass();
  // console.log('classSymbolTable', classSymbolTable);
  return outputString;
}
