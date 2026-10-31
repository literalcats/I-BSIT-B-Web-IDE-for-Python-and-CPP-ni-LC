// PRESET: Bubble sort
// Sorts an array by swapping neighbours that are out of order.
// Slow for big arrays, but it is a great way to learn how sorting works.

#include <iostream>
using namespace std;

int main() {
    int numbers[5] = {64, 25, 12, 22, 11};
    int n = 5;

    cout << "Before:";
    for (int i = 0; i < n; i++) {
        cout << " " << numbers[i];
    }
    cout << endl;

    for (int i = 0; i < n - 1; i++) {             // each pass puts one more number in place
        for (int j = 0; j < n - 1 - i; j++) {     // compare neighbours
            if (numbers[j] > numbers[j + 1]) {    // out of order?
                int temp = numbers[j];            // swap using a spare variable
                numbers[j] = numbers[j + 1];
                numbers[j + 1] = temp;
            }
        }
    }

    cout << "After: ";
    for (int i = 0; i < n; i++) {
        cout << " " << numbers[i];
    }
    cout << endl;
    return 0;
}
