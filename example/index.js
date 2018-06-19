const PYTool = require('../dist/index');
var pYTool = new PYTool.PYTool();
var fomular = `& & | A B | C | D E A`;
console.log(fomular);
console.log(pYTool.polish.calculate(fomular));
console.log(pYTool.py.eval(pYTool.polish.calculate(fomular), { A: false, B: true, C: false, D: true, E: false }));