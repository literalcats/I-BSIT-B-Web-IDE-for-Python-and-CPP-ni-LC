// PRESET: Asking the user (cin)
// cin >> variable; reads what the user types into the variable.
// In this app, type your answers in the Input tab (separate them with spaces or new lines).
// Note: the answers you type are not shown in the output here.

#include <iostream>
using namespace std;

int main() {
    int birthYear;                        // make room for the answer first
    int currentYear;

    cout << "Year you were born: ";
    cin >> birthYear;                     // the >> arrows point INTO the variable
    cout << endl;

    cout << "This year: ";
    cin >> currentYear;
    cout << endl;

    cout << "You are about " << currentYear - birthYear << " years old." << endl;
    return 0;
}
