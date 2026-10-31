// PRESET: Variables and data types
// A variable is a named box that holds a value. In C++ you choose its TYPE.

#include <iostream>
using namespace std;

int main() {
    // --- Create variables (the type comes first) ---
    int age = 17;                         // int    : whole number
    double height = 1.62;                 // double : decimal number
    char grade = 'A';                     // char   : ONE character, in single quotes

    // --- Show them ---
    cout << "Age: " << age << endl;
    cout << "Height: " << height << endl;
    cout << "Grade: " << grade << endl;

    // --- You can change a variable later ---
    age = age + 1;
    cout << "Next year I will be " << age << endl;
    return 0;
}
