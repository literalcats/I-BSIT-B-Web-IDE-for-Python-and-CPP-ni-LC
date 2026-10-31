// PRESET: ASCII art - a box
// Draws a rectangle with a border and an empty inside.

#include <iostream>
using namespace std;

int main() {
    int width;
    int height;
    cout << "Width and height (example: 10 4): ";
    cin >> width >> height;
    cout << endl;

    for (int row = 1; row <= height; row++) {
        for (int col = 1; col <= width; col++) {
            // the border is the first/last row and the first/last column
            if (row == 1 || row == height || col == 1 || col == width) {
                cout << "#";
            } else {
                cout << " ";
            }
        }
        cout << endl;
    }
    return 0;
}
