// PRESET: Simple calculator
// Reads two numbers and an operator, then shows the answer.
// Type them in the Input tab, for example:  8 / 2

#include <iostream>
using namespace std;

int main() {
    double a;
    double b;
    char op;                              // one character: + - * /

    cout << "Type: number operator number (example: 8 / 2)" << endl;
    cin >> a >> op >> b;                  // reads all three, in order

    // --- Choose what to do based on the operator ---
    switch (op) {
        case '+':
            cout << a + b << endl;
            break;                        // break stops us from running the next case
        case '-':
            cout << a - b << endl;
            break;
        case '*':
            cout << a * b << endl;
            break;
        case '/':
            if (b == 0) {                 // never divide by zero!
                cout << "Error: you cannot divide by zero." << endl;
            } else {
                cout << a / b << endl;
            }
            break;
        default:                          // none of the cases matched
            cout << "Unknown operator" << endl;
    }
    return 0;
}
