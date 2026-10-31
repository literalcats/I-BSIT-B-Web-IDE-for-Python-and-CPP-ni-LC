// PRESET: Prime number checker
// A prime number can only be divided evenly by 1 and itself (2, 3, 5, 7, 11 ...).

#include <iostream>
using namespace std;

bool isPrime(int n) {
    if (n < 2) {                          // 0 and 1 are not prime
        return false;
    }
    for (int divisor = 2; divisor < n; divisor++) {   // try 2 up to n - 1
        if (n % divisor == 0) {           // divides evenly -> NOT prime
            return false;
        }
    }
    return true;                          // nothing divided it -> prime
}

int main() {
    int number;
    cout << "Enter a number: ";
    cin >> number;
    cout << endl;

    if (isPrime(number)) {
        cout << number << " is prime" << endl;
    } else {
        cout << number << " is not prime" << endl;
    }
    return 0;
}
