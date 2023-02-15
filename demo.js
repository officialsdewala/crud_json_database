function sum(a) {

  let currentSum = a;

  function f(b) {
    currentSum += b;
    return f;
  }



  return f;
}

console.log(sum(1)(2).toString())