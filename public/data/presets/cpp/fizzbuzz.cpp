// PRESET: FizzBuzz (a famous practice problem)
// Count from 1 to 20.
//   multiples of 3    -> "Fizz"
//   multiples of 5    -> "Buzz"
//   multiples of both -> "FizzBuzz"

#include <iostream>
using namespace std;

int main() {
    for (int n = 1; n <= 20; n++) {
        if (n % 3 == 0 && n % 5 == 0) {   // % is the remainder; 0 means "divides evenly"
            cout << "FizzBuzz" << endl;
        } else if (n % 3 == 0) {
            cout << "Fizz" << endl;
        } else if (n % 5 == 0) {
            cout << "Buzz" << endl;
        } else {
            cout << n << endl;
        }
    }
    return 0;
}
