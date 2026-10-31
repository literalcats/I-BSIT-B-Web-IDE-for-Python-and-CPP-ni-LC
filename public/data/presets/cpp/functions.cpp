// PRESET: Functions
// A function is a named block of code you can use again and again.
// Functions must be written ABOVE main() (or declared above it).

#include <iostream>
using namespace std;

// --- 1. A function with no inputs that returns nothing (void) ---
void greet() {
    cout << "Hello from a function!" << endl;
}

// --- 2. A function with inputs (parameters) that RETURNS an answer ---
int area(int width, int height) {
    return width * height;                // return sends the answer back
}

// --- 3. A function that answers yes/no ---
bool isEven(int n) {
    return n % 2 == 0;                    // true when n divides evenly by 2
}

int main() {
    // --- Using (calling) the functions ---
    greet();
    cout << "Area: " << area(5, 3) << endl;          // 15

    if (isEven(10)) {
        cout << "10 is even" << endl;
    }
    if (!isEven(7)) {
        cout << "7 is odd" << endl;
    }
    return 0;
}
