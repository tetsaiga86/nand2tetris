
export default class SymbolTable{
  constructor() {
    this.classSymbols = {};
    this.subroutineSymbols = {};
    this.count = {
      'static':0,
      'field':0,
      'arg':0,
      'var':0
    };
  }

  startSubroutine() {
    this.subroutineSymbols = {};
    this.count.var = 0;
    this.count.arg = 0;
  }

  define(name, type, kind){
    const row = {
      name,
      type,
      kind,
      index: this.varCount(kind)
    };
    this.count[kind] += 1;

    if (kind == 'static' || kind == 'field') {
      this.classSymbols[name] = row;
    } else {
      this.subroutineSymbols[name] = row;
    }
  }

  varCount(kind){
    return this.count[kind];
  }

  kindOf(name){
    if(!this.classSymbols[name] && !this.subroutineSymbols[name]) return 'NONE';
    if (this.subroutineSymbols[name]) {
      return this.subroutineSymbols[name].kind;
    }else return this.classSymbols[name].kind;
  }

  typeOf(name){
    var symbol = this.lookup(name);
    if(symbol) return symbol.kind;
    return '';
  }

  indexOf(name){
    var symbol = this.lookup(name);
    if(symbol) return symbol.index;
    return -1;
  }

  lookup(name){
    if(this.classSymbols[name]){
      return this.classSymbols[name]
    }else if (this.subroutineSymbols[name]) {
      return this.subroutineSymbols[name]
    }else {
      return null;
    }
  }
}
