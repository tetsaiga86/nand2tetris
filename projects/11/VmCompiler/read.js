import fs from 'fs';
export default function read(file){
  var codeLines = [];
  var data = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$|\/\*\*.*|\/\/.*|[\t\f\r]*/g, '').trim().split('\n');
  data.forEach((line) => {
    var trimmedLine = line.trim();
    if (trimmedLine != '') {
      codeLines.push(trimmedLine);
      // console.log(trimmedLine);
    }
  })
  return codeLines;
}
