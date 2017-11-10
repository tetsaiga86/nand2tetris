import fs from 'fs';
export default function write(output, string) {
  fs.writeFile(output, string, 'utf8', (err) => {
    if (err) throw err;
    console.log(`${output} has been saved`);
  });
}
