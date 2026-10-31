// PRESET: Add numbers until 0 (while loop)
// A while loop repeats for as long as its condition is true.
// Type the numbers in the Input tab, ending with 0.

#include <iostream>
using namespace std;

int main() {
    int total = 0;
    int number;

    cout << "Enter numbers (0 to stop):" << endl;
    cin >> number;

    while (number != 0) {                 // keep going until the user types 0
        total = total + number;           // add it to the running total
        cin >> number;                    // read the next number
    }

    cout << "The total is " << total << endl;
    return 0;
}
