require('import-export');
var tokenize = require('./tokenizer.js');
var compile = require('./compilationEngine.js');
// tokenize('../ArrayTest');
// tokenize('../ExpressionLessSquare');
// tokenize('../Square');

// compile('./myOutputFiles/ArrayTest/MainT.xml')

// compile('./myOutputFiles/ExpressionLessSquare/MainT.xml')
// compile('./myOutputFiles/ExpressionLessSquare/SquareGameT.xml')
// compile('./myOutputFiles/ExpressionLessSquare/SquareT.xml')

// compile('./myOutputFiles/Square/MainT.xml')
// compile('./myOutputFiles/Square/SquareGameT.xml')
compile('./myOutputFiles/Square/SquareT.xml')
