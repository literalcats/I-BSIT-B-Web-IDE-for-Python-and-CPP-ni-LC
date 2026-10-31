// PRESET: Age calculator
// Works out a person's age from their birth year and the current year.
// Type both years in the Input tab (example: 2008 2026).

#include <iostream>
using namespace std;

int main() {
    int birthYear;
    int currentYear;

    cout << "Birth year and current year (example: 2008 2026): ";
    cin >> birthYear >> currentYear;
    cout << endl;

    int age = currentYear - birthYear;

    // --- Check the answer makes sense ---
    if (birthYear > currentYear) {
        cout << "That year has not happened yet!" << endl;
    } else if (age < 18) {
        cout << "You are about " << age << " years old (a minor)." << endl;
    } else {
        cout << "You are about " << age << " years old (an adult)." << endl;
    }
    return 0;
}
