let value = "caca maca cwdsdsds \" naidd \"\" daaaa na";
let expr = "\"";
var re = new RegExp(expr, 'g');
let new_value = value.replace(re, "");
console.log(new_value);
let test_val = String(undefined).replace(re, "");