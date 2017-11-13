
export default class SymbolTable{
  constructor() {
    this.table = {};
    this.count = {
      'static':0,
      'field':0,
      'arg':0,
      'var':0
    };
  }

  // startSubroutine() {
  //   this.subTable = {};
  // }

  define(name, type, kind){
    const row = {
      name,
      type,
      kind,
      index: this.varCount(kind)
    };
    this.count[kind] += 1;
    this.table[name] = row;
  }

  varCount(kind){
    return this.count[kind];
  }

  kindOf(name){
    if(!this.table[name]) return 'NONE';
    return this.table[name].kind;
  }

  typeOf(name){
    return this.table[name].type;
  }

  indexOf(name){
    return this.table[name].index;
  }
}



// consuming file:
