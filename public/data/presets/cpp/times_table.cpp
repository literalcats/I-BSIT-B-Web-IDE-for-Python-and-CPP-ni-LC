// PRESET: Multiplication table (for loop)
// A for loop repeats code: for (start; keep going while; change each round)

#include <iostream>
using namespace std;

int main() {
    int number;
    cout << "Which times table? ";
    cin >> number;
    cout << endl;

    for (int i = 1; i <= 10; i++) {       // i goes 1, 2, 3 ... 10  (i++ means add 1)
        cout << number << " x " << i << " = " << number * i << endl;
    }
    return 0;
}
