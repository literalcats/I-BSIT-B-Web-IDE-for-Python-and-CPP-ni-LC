// PRESET: ASCII art - triangles
// Nested loops: the outer loop makes the rows, the inner loops make the characters.

#include <iostream>
using namespace std;

int main() {
    int size;
    cout << "How many rows? ";
    cin >> size;
    cout << endl;

    cout << "Right triangle:" << endl;
    for (int row = 1; row <= size; row++) {
        for (int col = 1; col <= row; col++) {   // row 1 -> 1 star, row 2 -> 2 stars ...
            cout << "*";
        }
        cout << endl;                            // new line after each row
    }

    cout << endl;
    cout << "Pyramid:" << endl;
    for (int row = 1; row <= size; row++) {
        for (int s = 1; s <= size - row; s++) {  // first the spaces ...
            cout << " ";
        }
        for (int star = 1; star <= 2 * row - 1; star++) {   // ... then 1, 3, 5, 7 stars
            cout << "*";
        }
        cout << endl;
    }
    return 0;
}
