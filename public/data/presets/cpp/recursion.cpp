// PRESET: Recursion
// Recursion = a function that calls ITSELF on a smaller problem.
// Every recursive function needs a BASE CASE, the place where it stops.

#include <iostream>
using namespace std;

int factorial(int n) {
    // factorial(4) = 4 * 3 * 2 * 1 = 24
    if (n <= 1) {                         // base case: stop here
        return 1;
    }
    return n * factorial(n - 1);          // recursive case: a smaller problem
}

int fibonacci(int n) {
    // 0, 1, 1, 2, 3, 5, 8, 13 ... each number is the sum of the two before it
    if (n < 2) {                          // base case
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "5! = " << factorial(5) << endl;         // 120
    for (int i = 0; i < 10; i++) {
        cout << "fibonacci " << i << " = " << fibonacci(i) << endl;
    }
    return 0;
}
