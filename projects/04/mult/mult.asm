// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)
//(Ints >= 0 Only)
// Put your code here.
  @R2  //set ans to 0
  M=0
  @R1  //set D to incrementor(val2)
  D=M
  @END  //jump if either is 0
  D;JEQ
  @R0
  D=M
  @END
  D;JEQ
  @R0  //Set D to val1
  D=M
// create loop that adds val1 to itself val2 times and save it to @2
(LOOP)
  @R2
  M=M+D
  @R1
  M=M-1
  D=M
  @END
  D;JEQ
  @R0
  D=M
  @LOOP
  0;JMP

(END)
  @END
  0;JMP
