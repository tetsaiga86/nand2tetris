require('import-export');
var fs = require('fs');
var tokenize = require('./tokenizer.js');
var compile = require('./compilationEngine.js');
var write = require('./write.js');

var dir = '../Pong',
    jackFiles = [];

(function getJackFiles(dir){
  var files = fs.readdirSync(dir);

  files.forEach((file) => {
    if(file.includes('.jack')) jackFiles.push(file);
  })
})(dir);

jackFiles.forEach((fileName) => {
  var inputLocation = `${dir}/${fileName}`;
  var outputLocation = `${dir}/${fileName.replace('.jack', '.xml')}`;
  var outputString = compile(tokenize(inputLocation));
  // write(outputLocation, outputString);
})
