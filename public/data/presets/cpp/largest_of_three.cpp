// PRESET: Largest of three numbers
// Compare the numbers with if / else if / else.

#include <iostream>
using namespace std;

int main() {
    int a;
    int b;
    int c;
    cout << "Type three numbers: ";
    cin >> a >> b >> c;
    cout << endl;

    int largest;
    if (a >= b && a >= c) {               // a beats both of the others
        largest = a;
    } else if (b >= a && b >= c) {        // b beats both of the others
        largest = b;
    } else {                              // then c must be the largest
        largest = c;
    }

    cout << "The largest number is " << largest << endl;
    return 0;
}
