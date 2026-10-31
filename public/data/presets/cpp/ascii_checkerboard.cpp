// PRESET: ASCII art - checkerboard
// Idea: add the row number and column number.
// If the sum is even draw "#", otherwise draw ".".

#include <iostream>
using namespace std;

int main() {
    int size = 8;

    for (int row = 0; row < size; row++) {
        for (int col = 0; col < size; col++) {
            if ((row + col) % 2 == 0) {       // even sum -> dark square
                cout << "# ";
            } else {                          // odd sum -> light square
                cout << ". ";
            }
        }
        cout << endl;
    }
    return 0;
}
