// PRESET: Grade boundaries
// Turns a score (0 to 100) into a letter grade.
// NOTE: change the numbers below to match your school's grading rules.

#include <iostream>
using namespace std;

int main() {
    int score;
    cout << "Enter the score (0-100): ";
    cin >> score;
    cout << endl;

    if (score < 0 || score > 100) {       // check the input first
        cout << "A score must be between 0 and 100." << endl;
    } else if (score >= 90) {
        cout << "Grade: A" << endl;
    } else if (score >= 80) {
        cout << "Grade: B" << endl;
    } else if (score >= 70) {
        cout << "Grade: C" << endl;
    } else if (score >= 60) {
        cout << "Grade: D" << endl;
    } else {
        cout << "Grade: F" << endl;
    }
    return 0;
}
