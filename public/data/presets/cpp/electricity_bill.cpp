// PRESET: Electricity bill calculator
// The more electricity you use, the higher the price per kWh (tiered rates).
// NOTE: these rates are made up for practice. They are not real.

#include <iostream>
using namespace std;

int main() {
    int kwh;
    cout << "Electricity used (whole kWh): ";
    cin >> kwh;
    cout << endl;

    // --- Rate per kWh in each tier (change these to experiment) ---
    double rateFirst100 = 9.50;           // kWh 1 to 100
    double rateNext100 = 11.25;           // kWh 101 to 200
    double rateAbove = 13.00;             // kWh above 200

    double total;
    if (kwh <= 100) {
        total = kwh * rateFirst100;
    } else if (kwh <= 200) {
        total = 100 * rateFirst100 + (kwh - 100) * rateNext100;
    } else {
        total = 100 * rateFirst100 + 100 * rateNext100 + (kwh - 200) * rateAbove;
    }

    // Showing exactly 2 decimals needs <iomanip>, so we do it by hand:
    // turn the money into whole centavos, then split it into pesos and centavos.
    int centavos = total * 100;           // a double stored in an int drops the decimals
    int pesos = centavos / 100;
    int rest = centavos % 100;

    cout << "Usage: " << kwh << " kWh" << endl;
    cout << "Total bill: " << pesos << ".";
    if (rest < 10) {
        cout << "0";                      // so 5 centavos prints as .05, not .5
    }
    cout << rest << endl;
    return 0;
}
