export default function makeRegex(arr){
  var regexPattern = new RegExp(arr[0]);

  for(var i = 1; i < arr.length; i++) {
    const val = arr[i];
    regexPattern = new RegExp(regexPattern.source + '|' + val.source, 'g');
  }
  return regexPattern;
}

// export default function makeRegex(arr){
//   var regexPattern = new RegExp(`^${arr[0]}$`);
//
//   for(var i = 1; i < arr.length; i++) {
//     const val = arr[i];
//     regexPattern = new RegExp(regexPattern.source + '|' + '^' + val.source + '$', 'g');
//   }
//   return regexPattern;
// }
