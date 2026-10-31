// PRESET: ASCII art - diamond
// A diamond is a pyramid on top of an upside-down pyramid.

#include <iostream>
using namespace std;

int main() {
    int size;
    cout << "Size of the diamond (try 4): ";
    cin >> size;
    cout << endl;

    // --- Top half (growing) ---
    for (int row = 1; row <= size; row++) {
        for (int s = 1; s <= size - row; s++) {
            cout << " ";
        }
        for (int star = 1; star <= 2 * row - 1; star++) {
            cout << "*";
        }
        cout << endl;
    }

    // --- Bottom half (shrinking): row counts DOWN ---
    for (int row = size - 1; row >= 1; row--) {
        for (int s = 1; s <= size - row; s++) {
            cout << " ";
        }
        for (int star = 1; star <= 2 * row - 1; star++) {
            cout << "*";
        }
        cout << endl;
    }
    return 0;
}
