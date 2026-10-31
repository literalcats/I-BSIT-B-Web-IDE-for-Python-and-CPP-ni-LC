# C++ cheat sheet for I-BSIT-B

<!--
HOW TO ADD A TOPIC: copy any block below, change the words, save the file.
level: 1 easiest ... 4 hardest.   importance: must | good | nice.
runs:  yes = runs in this app | maybe = might run | no = needs a real compiler (g++)
kind:  statements = goes INSIDE main() (the app adds the boilerplate)
       program    = a complete file with its own main()
Every example is compiled with g++ by the tests.
-->

## Program structure and cout
level: 1
importance: must
runs: yes
kind: program
summary: The parts every C++ program has, and how to print.

- #include brings in tools. iostream gives you cout (output) and cin (input).
- The program starts at main(). Every statement ends with a semicolon ;
- endl ends the line. return 0 means "finished without problems".

```cpp
#include <iostream>        // gives us cout and cin
using namespace std;       // lets us write cout instead of std::cout

int main() {               // the program starts running here
    cout << "Hello, BSIT!" << endl;    // << sends text to the screen
    cout << "2 + 3 = " << 2 + 3 << endl;
    return 0;              // 0 = finished without problems
}
```

## Variables and data types
level: 1
importance: must
runs: yes
kind: statements
summary: Name a value, and choose what type of value it is.

- int = whole number. double = decimal number. char = ONE character in single quotes.
- You must say the type when you create a variable.
- Use clear names like totalScore, not x.

```cpp
int age = 17;              // whole number
double height = 1.62;      // decimal number
char grade = 'A';          // one character, single quotes

cout << "Age: " << age << endl;
cout << "Height: " << height << endl;
cout << "Grade: " << grade << endl;
```

## Arithmetic operators
level: 1
importance: must
runs: yes
kind: statements
summary: Add, subtract, multiply, divide, and find remainders.

- + - * / and % (remainder, whole numbers only).
- Careful: int / int drops the decimal, so 7 / 2 is 3, not 3.5.
- To keep the decimal, store one number in a double first.

```cpp
int a = 7;
int b = 2;
cout << a + b << endl;        // 9
cout << a / b << endl;        // 3   (int divided by int drops the decimal)
cout << a % b << endl;        // 1   (remainder)

double x = a;                 // now x is 7.0, a decimal number
cout << x / b << endl;        // 3.5
```

## Input with cin
level: 1
importance: must
runs: yes
kind: statements
stdin: 17
summary: Read what the user types into a variable.

- cin >> variable; reads one value. The >> arrows point INTO the variable.
- In this app, type the answers in the Input tab. Separate answers with spaces or new lines.
- The type of the variable decides what cin accepts.

```cpp
int age;
cout << "Your age: ";
cin >> age;                   // waits for a number
cout << "Next year you will be " << age + 1 << endl;
```

## Comparison and logic operators
level: 1
importance: must
runs: yes
kind: statements
summary: Ask yes/no questions about values.

- == equal, != not equal, <, >, <=, >=.
- && means AND, || means OR, ! means NOT.
- A single = stores a value. A double == compares.

```cpp
int age = 17;

if (age >= 13 && age <= 19) {     // && : both must be true
    cout << "Teenager" << endl;
}
if (age < 5 || age > 60) {        // || : at least one must be true
    cout << "Discount" << endl;
} else {
    cout << "No discount" << endl;
}
if (!(age == 18)) {               // ! flips true and false
    cout << "Not 18" << endl;
}
```

## if, else if, else
level: 2
importance: must
runs: yes
kind: statements
summary: Make the program choose what to do.

- C++ checks from top to bottom and runs the first block whose condition is true.
- Use { } around the code of each branch.
- else runs when nothing above was true.

```cpp
int score = 85;

if (score >= 90) {
    cout << "Excellent" << endl;
} else if (score >= 75) {         // only checked if the first one was false
    cout << "Passed" << endl;
} else {                          // runs when nothing above was true
    cout << "Failed" << endl;
}
```

## switch
level: 2
importance: good
runs: yes
kind: statements
summary: Choose between many fixed values.

- switch compares one variable with several case values.
- break ends a case. Without it, the next case runs too ("fall through").
- default runs when no case matches.

```cpp
int day = 3;

switch (day) {
    case 1:
        cout << "Monday" << endl;
        break;                    // always break, or it falls into the next case
    case 2:
        cout << "Tuesday" << endl;
        break;
    case 3:
        cout << "Wednesday" << endl;
        break;
    default:                      // no case matched
        cout << "Another day" << endl;
}
```

## for loops
level: 2
importance: must
runs: yes
kind: statements
summary: Repeat something a set number of times.

- for (start; keep going while; change after each round)
- i++ means "add 1 to i".
- Counting starts at 0 in most C++ code.

```cpp
for (int i = 1; i <= 5; i++) {    // start; condition; step
    cout << "Number " << i << endl;
}
```

## while and do-while loops
level: 2
importance: must
runs: yes
kind: statements
summary: Repeat while a condition stays true.

- while checks the condition BEFORE each round.
- do-while runs at least once, then checks AFTER the round.
- Always change something inside the loop, or it never ends. Press Stop if it does.

```cpp
int count = 3;
while (count > 0) {               // checked first
    cout << "Countdown: " << count << endl;
    count--;                      // count-- means subtract 1
}

int n = 0;
do {                              // runs once even though n is 0
    cout << "n is " << n << endl;
    n++;
} while (n < 2);
```

## break and continue
level: 2
importance: good
runs: yes
kind: statements
summary: Leave a loop early or skip one round.

- break leaves the whole loop immediately.
- continue skips the rest of this round and starts the next one.

```cpp
for (int n = 1; n <= 7; n++) {
    if (n == 3) {
        continue;                 // skip 3
    }
    if (n == 6) {
        break;                    // stop the loop at 6
    }
    cout << n << " ";             // prints 1 2 4 5
}
cout << endl;
```

## Constants and macros
level: 2
importance: good
runs: yes
kind: program
summary: Values that must never change.

- const makes a variable read-only. Use it for fixed values like pi.
- #define replaces a name with a value before the program is compiled.
- By habit, constants are written in CAPITALS.

```cpp
#include <iostream>
using namespace std;

#define SCHOOL_YEAR 1             // a macro: replaced before compiling

int main() {
    const double PI = 3.14;       // const: cannot be changed later
    double radius = 2;
    cout << "Area: " << PI * radius * radius << endl;
    cout << "Year: " << SCHOOL_YEAR << endl;
    return 0;
}
```

## Math functions (cmath)
level: 2
importance: good
runs: yes
kind: program
summary: Square roots, powers, and rounding.

- Add #include <cmath>.
- sqrt(x) square root, pow(x, y) power, floor(x) round down, ceil(x) round up.

```cpp
#include <iostream>
#include <cmath>              // the math tools
using namespace std;

int main() {
    cout << sqrt(49) << endl;       // 7
    cout << pow(2, 3) << endl;      // 8  (2 to the power of 3)
    cout << floor(3.9) << endl;     // 3  (round down)
    cout << ceil(3.1) << endl;      // 4  (round up)
    return 0;
}
```

## Strings (std::string)
level: 2
importance: must
runs: no
kind: program
summary: Store and join text.

- Add #include <string>. A string holds text in double quotes.
- + joins strings. .length() counts characters. text[0] is the first character.
- cin >> text reads one word. To read a whole line, use getline(cin, text).

```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    string name = "Ana";
    string course = "BSIT";

    cout << "Hello, " + name << endl;        // + joins strings
    cout << name + " " + course << endl;
    cout << name.length() << endl;           // 3 characters
    cout << name[0] << endl;                 // A  (first character, counting from 0)
    return 0;
}
```

## Arrays
level: 3
importance: must
runs: yes
kind: statements
summary: Store many values of the same type under one name.

- int scores[5] makes room for 5 ints, numbered 0 to 4.
- The last index is size - 1. Going past it is a bug that may not warn you.
- Loop through an array with a for loop.

```cpp
int scores[5] = {88, 92, 75, 60, 95};     // 5 values, indexes 0 to 4

cout << scores[0] << endl;                // 88  (the first one is 0, not 1)
scores[1] = 100;                          // change one value

int total = 0;
for (int i = 0; i < 5; i++) {             // i < 5, NOT i <= 5
    total = total + scores[i];
}
cout << "Total: " << total << endl;
```

## 2D arrays
level: 3
importance: good
runs: yes
kind: statements
summary: A table of values with rows and columns.

- int grid[2][3] has 2 rows and 3 columns.
- grid[row][col] picks one value.
- Use a nested loop to visit every cell.

```cpp
int grid[2][3] = {
    {1, 2, 3},
    {4, 5, 6}
};

cout << grid[1][2] << endl;               // 6 (row 1, column 2)

for (int row = 0; row < 2; row++) {
    for (int col = 0; col < 3; col++) {
        cout << grid[row][col] << " ";
    }
    cout << endl;
}
```

## Nested loops and patterns
level: 3
importance: must
runs: yes
kind: statements
summary: A loop inside a loop, perfect for ASCII art and tables.

- The inner loop finishes completely for every round of the outer loop.
- Outer loop = rows. Inner loop = columns.

```cpp
int rows = 4;
for (int row = 1; row <= rows; row++) {   // outer loop: each row
    for (int col = 1; col <= row; col++) {    // inner loop: stars in this row
        cout << "*";
    }
    cout << endl;                         // new line after each row
}
```

## Functions
level: 3
importance: must
runs: yes
kind: program
summary: Give a block of code a name so you can reuse it.

- A function has a return type, a name, parameters, and a body.
- void means "returns nothing". Otherwise use return to send a value back.
- Define the function above main(), or write its first line (a prototype) above main().

```cpp
#include <iostream>
using namespace std;

int area(int width, int height) {      // returns an int
    return width * height;
}

void greet() {                         // void: returns nothing
    cout << "Hello from a function!" << endl;
}

int main() {
    greet();
    cout << "Area: " << area(5, 3) << endl;    // 15
    return 0;
}
```

## Pass by reference
level: 3
importance: good
runs: no
kind: program
summary: Let a function change the original variable.

- Normally a function gets a COPY of the value, so the original does not change.
- Adding & (int &x) passes the original itself.

```cpp
#include <iostream>
using namespace std;

void addOne(int &number) {         // & = the original, not a copy
    number = number + 1;
}

int main() {
    int score = 10;
    addOne(score);
    cout << score << endl;         // 11 (it changed!)
    return 0;
}
```

## Character arrays (C-strings)
level: 3
importance: good
runs: yes
kind: program
summary: Text stored as an array of characters, with cstring helpers.

- A char array ends with a hidden '\0' marker, so leave room for it.
- Add #include <cstring>: strlen counts characters, strcmp compares (0 means equal).

```cpp
#include <iostream>
#include <cstring>                   // strlen, strcmp, strcpy
using namespace std;

int main() {
    char word[20] = "BSIT";
    cout << word << endl;
    cout << strlen(word) << endl;    // 4 characters

    if (strcmp(word, "BSIT") == 0) { // 0 means the two are equal
        cout << "Same word" << endl;
    }
    return 0;
}
```

## struct
level: 3
importance: good
runs: no
kind: program
summary: Group different kinds of data into one new type.

- A struct is a bundle of variables (members) under one name.
- Use the dot . to reach a member: student.age
- It is the stepping stone to classes.

```cpp
#include <iostream>
using namespace std;

struct Student {              // a new type made of 2 variables
    int age;
    double grade;
};

int main() {
    Student ana;
    ana.age = 17;
    ana.grade = 92.5;
    cout << ana.age << " " << ana.grade << endl;
    return 0;
}
```

## Bubble sort
level: 3
importance: good
runs: yes
kind: statements
summary: Sort an array by swapping neighbours.

- Compare each pair of neighbours and swap them if they are out of order.
- Repeat until a full pass makes no swaps. It is slow, but easy to understand.

```cpp
int numbers[5] = {5, 2, 9, 1, 7};

for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4 - i; j++) {
        if (numbers[j] > numbers[j + 1]) {     // out of order?
            int temp = numbers[j];             // swap using a spare variable
            numbers[j] = numbers[j + 1];
            numbers[j + 1] = temp;
        }
    }
}

for (int i = 0; i < 5; i++) {
    cout << numbers[i] << " ";                 // 1 2 5 7 9
}
cout << endl;
```

## Pointers
level: 4
importance: must
runs: yes
kind: statements
summary: A variable that stores the address of another variable.

- &x means "the address of x". int *p stores an address.
- *p means "the value at that address".
- Pointers are tricky at first. Draw boxes and arrows on paper.

```cpp
int x = 10;
int *p = &x;                  // p holds the address of x

cout << x << endl;            // 10
cout << *p << endl;           // 10  (the value p points to)

*p = 20;                      // change x THROUGH the pointer
cout << x << endl;            // 20
```

## Pointers and arrays
level: 4
importance: good
runs: yes
kind: statements
summary: An array name is the address of its first item.

- p + 1 moves to the next item (not the next byte).
- *(p + 1) is the same as p[1].

```cpp
int numbers[3] = {10, 20, 30};
int *p = numbers;             // points to numbers[0]

cout << *p << endl;           // 10
cout << *(p + 1) << endl;     // 20  (the next item)
cout << p[2] << endl;         // 30  (pointers can use [ ] too)
```

## Recursion
level: 4
importance: must
runs: yes
kind: program
summary: A function that calls itself on a smaller problem.

- Every recursive function needs a base case (when to stop) and a recursive case.
- Without a base case it never ends and the program crashes.
- Trace small inputs by hand first: factorial(3), then factorial(4).

```cpp
#include <iostream>
using namespace std;

int factorial(int n) {
    if (n <= 1) {                      // base case: stop here
        return 1;
    }
    return n * factorial(n - 1);       // recursive case: a smaller problem
}

int main() {
    cout << factorial(5) << endl;      // 120
    return 0;
}
```

## Classes and objects
level: 4
importance: must
runs: no
kind: program
summary: Bundle data and the actions on that data together.

- A class is a blueprint. An object is one thing built from it.
- public members can be used from outside. private members are hidden.
- A constructor runs when an object is created. It has the same name as the class.
- Needs a real compiler (g++). This app's C++ engine does not support classes.

```cpp
#include <iostream>
using namespace std;

class Student {
private:
    int grade;                         // hidden from outside code
public:
    Student(int g) {                   // constructor
        grade = g;
    }
    bool passed() {                    // a method
        return grade >= 75;
    }
};

int main() {
    Student ana(88);                   // make an object
    if (ana.passed()) {
        cout << "Passed" << endl;
    }
    return 0;
}
```

## Inheritance
level: 4
importance: good
runs: no
kind: program
summary: Make a new class that reuses and extends another one.

- class Child : public Parent gets everything public from the parent.
- Needs a real compiler (g++). This app's C++ engine does not support classes.

```cpp
#include <iostream>
using namespace std;

class Animal {
public:
    void eat() {
        cout << "Eating..." << endl;
    }
};

class Dog : public Animal {            // Dog inherits from Animal
public:
    void bark() {
        cout << "Woof!" << endl;
    }
};

int main() {
    Dog d;
    d.eat();                           // from Animal
    d.bark();                          // from Dog
    return 0;
}
```

## Dynamic memory: new and delete
level: 4
importance: good
runs: no
kind: statements
summary: Ask for memory while the program is running, then give it back.

- new reserves memory and gives you a pointer to it.
- Every new needs a matching delete, or the memory leaks.

```cpp
int *p = new int(5);          // reserve space for one int holding 5
cout << *p << endl;           // 5
delete p;                     // give the memory back
```

## Vectors
level: 4
importance: good
runs: no
kind: program
summary: A list that grows and shrinks by itself.

- Add #include <vector>. vector<int> is a list of ints.
- push_back() adds to the end. size() tells how many items there are.
- Needs a real compiler (g++). This app's C++ engine does not support the STL.

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> scores;
    scores.push_back(88);              // add items
    scores.push_back(92);

    for (int i = 0; i < (int)scores.size(); i++) {
        cout << scores[i] << endl;
    }
    return 0;
}
```

## File input and output
level: 4
importance: good
runs: no
kind: program
summary: Write text to a file and read it back.

- Add #include <fstream>. ofstream writes, ifstream reads.
- Always check that the file opened.
- Needs a real compiler (g++) and a real computer, not the browser.

```cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    ofstream out("notes.txt");         // write to a file
    out << "Line one" << endl;
    out << "Line two" << endl;
    out.close();

    ifstream in("notes.txt");          // read it back
    string line;
    while (getline(in, line)) {
        cout << line << endl;
    }
    return 0;
}
```

## Exceptions: try and catch
level: 4
importance: good
runs: no
kind: program
summary: Handle errors without crashing the program.

- Put risky code in try. throw sends an error. catch handles it.
- Needs a real compiler (g++). This app's C++ engine does not support exceptions.

```cpp
#include <iostream>
using namespace std;

int main() {
    try {
        int divisor = 0;
        if (divisor == 0) {
            throw 1;                   // throw an error
        }
        cout << 10 / divisor << endl;
    } catch (int code) {               // handle it
        cout << "Cannot divide by zero (error " << code << ")" << endl;
    }
    return 0;
}
```

## Templates
level: 4
importance: nice
runs: no
kind: program
summary: Write one function that works for many types.

- template <typename T> lets T stand for any type.
- Needs a real compiler (g++). This app's C++ engine does not support templates.

```cpp
#include <iostream>
using namespace std;

template <typename T>
T biggest(T a, T b) {                  // works for int, double, ...
    return a > b ? a : b;
}

int main() {
    cout << biggest(3, 7) << endl;         // 7
    cout << biggest(2.5, 1.5) << endl;     // 2.5
    return 0;
}
```
