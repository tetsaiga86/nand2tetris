import fs from 'fs';
export default function read(file){
  var codeLines = [];
  var data = fs.readFileSync(file, 'utf8').replace(/\/\*\*.*|\/\/.*|[\t\f\r]*/g, '').trim().split('\n');
  data.forEach((line) => {
    if (line != '') {
      codeLines.push(line.trim());
    }
  })
  return codeLines;
}
