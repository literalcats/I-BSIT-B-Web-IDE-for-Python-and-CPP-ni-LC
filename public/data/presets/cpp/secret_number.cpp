// PRESET: Secret number game
// The secret number is from 1 to 10. You have 5 tries to guess it.
// Type your guesses in the Input tab (separate them with spaces or new lines).
// Challenge: change SECRET, or let a friend type their own number in the code!

#include <iostream>
using namespace std;

int main() {
    const int SECRET = 7;                 // const = a value that never changes
    const int TRIES = 5;
    bool won = false;                     // remembers if the player has won

    for (int attempt = 1; attempt <= TRIES && !won; attempt++) {
        int guess;
        cout << "Guess " << attempt << " of " << TRIES << ": ";
        cin >> guess;
        cout << guess << endl;

        if (guess == SECRET) {
            cout << "Correct! You win!" << endl;
            won = true;                   // this also stops the loop
        } else if (guess < SECRET) {
            cout << "Too low." << endl;
        } else {
            cout << "Too high." << endl;
        }
    }

    if (!won) {
        cout << "Out of tries. The number was " << SECRET << "." << endl;
    }
    return 0;
}
