# Python cheat sheet for I-BSIT-B

<!--
HOW TO ADD A TOPIC: copy any block below, change the words, save the file.
level: 1 easiest ... 4 hardest.   importance: must | good | nice.
Every code block must run on its own (the tests run them all).
-->

## Print and comments
level: 1
importance: must
summary: Show text on the screen and leave notes for yourself.

- print() shows text, numbers or both on the screen.
- Text goes inside quotes: "like this" or 'like this'.
- Everything after # is a comment. Python ignores it.

```python
# This is a comment. Python skips it.
print("Hello, BSIT!")      # print() shows text
print("2 + 3 =", 2 + 3)    # several things, separated by commas
print("Line 1\nLine 2")     # \n starts a new line
```

## Variables and data types
level: 1
importance: must
summary: Name a value so you can use it again.

- A variable is a name that holds a value: age = 17.
- Main types: int (whole number), float (decimal), str (text), bool (True or False).
- type() tells you the type of a value.

```python
name = "Ana"        # str  (text)
age = 17            # int  (whole number)
height = 1.62       # float (decimal number)
is_student = True   # bool (True or False)

print(name, age, height, is_student)
print(type(age))    # <class 'int'>
```

## Math operators
level: 1
importance: must
summary: Add, subtract, multiply, divide, and find remainders.

- + - * work as expected. / always gives a decimal (7 / 2 is 3.5).
- // divides and drops the decimal (7 // 2 is 3). % gives the remainder (7 % 2 is 1).
- ** is "to the power of" (2 ** 3 is 8).
- Python follows PEMDAS. Use parentheses to be clear.

```python
a = 7
b = 2
print(a + b)    # 9    add
print(a / b)    # 3.5  divide (always a decimal)
print(a // b)   # 3    divide and drop the decimal
print(a % b)    # 1    remainder (great for even/odd checks)
print(a ** b)   # 49   power
```

## Strings and f-strings
level: 1
importance: must
summary: Join text together and put variables inside text.

- An f-string starts with f and puts variables inside { }.
- + joins strings together. len() counts characters.
- Format decimals with {value:.2f} (2 decimal places).

```python
name = "Ana"
grade = 92.456

print(f"Hello, {name}!")            # f-string: easy and readable
print(f"Grade: {grade:.2f}")        # :.2f rounds to 2 decimal places
print("Hi " + name)                 # + joins strings
print(len(name))                    # 3 characters
```

## Input from the user
level: 1
importance: must
summary: Ask the user to type something, then turn it into a number.
stdin: Ana | 17

- input() always gives you text (str), even if the user types 5.
- Convert with int() for whole numbers or float() for decimals.
- In this app, type the answers in the Input tab, one per line.

```python
name = input("Your name: ")          # text
age = int(input("Your age: "))       # int() turns the text into a number
print(f"{name} will be {age + 1} next year.")
```

## Comparison and logic operators
level: 1
importance: must
summary: Ask yes/no questions about values.

- Compare with == (equal), != (not equal), <, >, <=, >=.
- Combine with and, or, not.
- A single = stores a value. A double == compares.

```python
age = 17
print(age == 17)                 # True
print(age >= 18)                 # False
print(age > 12 and age < 20)     # True: both must be true
print(age < 5 or age > 60)       # False: at least one must be true
print(not age == 17)             # False: flips True/False
```

## if, elif, else
level: 2
importance: must
summary: Make the program choose what to do.

- Python checks conditions from top to bottom and runs the first one that is True.
- The colon : and the indentation (4 spaces) are required.
- else runs when nothing above was True.

```python
score = 85

if score >= 90:
    print("Excellent")
elif score >= 75:        # only checked if the first one was False
    print("Passed")
else:                    # runs when nothing above was True
    print("Failed")
```

## for loops and range()
level: 2
importance: must
summary: Repeat something a set number of times.

- range(5) gives 0, 1, 2, 3, 4 (it stops BEFORE 5).
- range(start, stop, step): range(2, 11, 2) gives 2, 4, 6, 8, 10.
- A for loop can also walk through a list or a string.

```python
for i in range(1, 6):          # 1, 2, 3, 4, 5
    print("Number", i)

for letter in "BSIT":          # walks through each character
    print(letter)
```

## while loops
level: 2
importance: must
summary: Repeat for as long as a condition stays True.

- Use while when you do not know how many times to repeat.
- Always change something inside the loop, or it never ends.
- If a program never stops, press Stop.

```python
count = 3
while count > 0:               # repeat while this is True
    print("Countdown:", count)
    count = count - 1          # change the variable or the loop never ends
print("Liftoff!")
```

## break and continue
level: 2
importance: good
summary: Leave a loop early or skip one round.

- break leaves the whole loop immediately.
- continue skips the rest of this round and goes to the next one.

```python
for n in range(1, 8):
    if n == 3:
        continue       # skip 3
    if n == 6:
        break          # stop the loop at 6
    print(n)           # prints 1 2 4 5
```

## Lists
level: 2
importance: must
summary: Store many values in one variable.

- A list uses [ ]. Counting starts at 0, so the first item is list[0].
- Negative numbers count from the end: list[-1] is the last item.
- Useful: append(), remove(), len(), sum(), sorted().

```python
fruits = ["apple", "banana", "mango"]

print(fruits[0])           # apple (the first item is 0, not 1)
print(fruits[-1])          # mango (the last item)
fruits.append("grape")     # add to the end
fruits.remove("banana")    # remove by value
print(fruits, len(fruits))

scores = [88, 92, 75]
print(sum(scores) / len(scores))   # the average
```

## String methods and slicing
level: 2
importance: good
summary: Change the case of text and cut out pieces of it.

- Methods: upper(), lower(), strip(), replace(), split(), find().
- Slicing: text[start:stop] (stop is not included).
- Strings cannot be changed. Methods give back a new string.

```python
text = "  Hello, World  "
clean = text.strip()             # remove spaces at the ends
print(clean.upper())             # HELLO, WORLD
print(clean.replace("World", "BSIT"))
print(clean[0:5])                # Hello  (characters 0 to 4)
print(clean[::-1])               # reversed text
print("a,b,c".split(","))        # ['a', 'b', 'c']
```

## Modules: import
level: 2
importance: good
summary: Borrow ready-made tools like math and random.

- import brings in a module. Then use module.name.
- math has sqrt(), pi, ceil(), floor(). random has randint() and choice().
- Modules in the standard library work here. Extra packages do not.

```python
import math
import random

print(math.sqrt(49))              # 7.0
print(math.pi)                    # 3.14159...
print(random.randint(1, 6))       # a random dice roll, 1 to 6
print(random.choice(["rock", "paper", "scissors"]))
```

## Functions: def and call
level: 2
importance: must
summary: Give a block of code a name so you can reuse it.

- Define with def name(): and call with name().
- The code inside must be indented.
- Functions are one of the harder beginner ideas. Practice with tiny examples.

```python
def greet():                       # define the function
    print("Hello from a function!")

greet()                            # call it as many times as you like
greet()
```

## Parameters, return values and scope
level: 3
importance: must
summary: Send values into a function and get a result back.

- Parameters are the names in def f(a, b). Arguments are the values you pass.
- return sends a value back. print only shows it.
- Variables made inside a function exist only inside it (local scope).
- A parameter can have a default: def f(x, times=2).

```python
def area(width, height=1):         # height has a default value
    result = width * height        # 'result' only exists inside this function
    return result                  # send the answer back

print(area(5, 3))                  # 15
print(area(5))                     # 5 (uses the default height)
total = area(4, 4) + 1
print(total)                       # 17
```

## Dictionaries
level: 3
importance: must
summary: Store values by name (key) instead of by position.

- A dictionary uses { } with key: value pairs.
- Read with d["key"]. Use d.get("key", default) to avoid errors.
- Loop with .items() to get keys and values together.

```python
student = {"name": "Ana", "age": 17}

print(student["name"])                 # Ana
student["course"] = "BSIT"             # add a new key
print(student.get("grade", "none"))    # none (safe: no error if missing)

for key, value in student.items():     # keys and values together
    print(key, "->", value)
```

## Nested loops and patterns
level: 3
importance: must
summary: A loop inside a loop, perfect for ASCII art and tables.

- The inner loop finishes completely for every round of the outer loop.
- Outer loop = rows. Inner loop = columns.
- print(..., end="") stays on the same line.

```python
rows = 4
for row in range(1, rows + 1):         # outer loop: each row
    for col in range(row):             # inner loop: stars in this row
        print("*", end="")             # end="" stays on the same line
    print()                            # new line after each row
```

## 2D lists (grids)
level: 3
importance: good
summary: A list of lists, like a table or a matrix.

- grid[row][column] picks one value.
- Use a nested loop to visit every cell.

```python
grid = [
    [1, 2, 3],
    [4, 5, 6],
]
print(grid[1][2])                  # 6 (row 1, column 2)

for row in grid:                   # each row is a list
    for value in row:
        print(value, end=" ")
    print()
```

## Exceptions: try and except
level: 3
importance: must
summary: Handle errors without crashing the program.
stdin: 0

- Put risky code in try. If it fails, the matching except runs.
- Catch specific errors such as ValueError or ZeroDivisionError.
- finally always runs, whether there was an error or not.

```python
try:
    number = int(input("Enter a number: "))
    print(10 / number)
except ValueError:                       # typed letters instead of a number
    print("That is not a number.")
except ZeroDivisionError:                # typed 0
    print("You cannot divide by zero.")
```

## List comprehensions
level: 3
importance: good
summary: Build a new list in one short line.

- Pattern: [what for item in list if condition].
- Same result as a for loop with append, but shorter.

```python
squares = [n * n for n in range(1, 6)]
print(squares)                                   # [1, 4, 9, 16, 25]

evens = [n for n in range(1, 11) if n % 2 == 0]  # with a condition
print(evens)                                     # [2, 4, 6, 8, 10]
```

## Sorting and searching
level: 3
importance: good
summary: Put values in order and find a value in a list.

- sorted(list) gives a new sorted list. list.sort() sorts in place.
- min(), max() and "x in list" are quick searches.
- Bubble sort swaps neighbours until the list is in order. It is slow but great for learning.

```python
numbers = [5, 2, 9, 1]
print(sorted(numbers))             # [1, 2, 5, 9]
print(max(numbers), 9 in numbers)  # 9 True

# Bubble sort: swap neighbours until nothing is out of order
for i in range(len(numbers) - 1):
    for j in range(len(numbers) - 1 - i):
        if numbers[j] > numbers[j + 1]:
            numbers[j], numbers[j + 1] = numbers[j + 1], numbers[j]
print(numbers)                     # [1, 2, 5, 9]
```

## Test your code with assert
level: 3
importance: nice
summary: Check that a function gives the answer you expect.

- assert condition stops the program with an error if the condition is False.
- Write a few asserts for each function. They catch mistakes early.

```python
def is_even(n):
    return n % 2 == 0

assert is_even(4) == True        # passes silently
assert is_even(7) == False
print("All tests passed!")
```

## File handling
level: 3
importance: good
summary: Write text to a file and read it back.

- open(name, "w") writes, "r" reads, "a" adds to the end.
- The with block closes the file for you.
- Here, files live in a temporary space and disappear when the page reloads. On your own computer they are real files.

```python
with open("notes.txt", "w") as f:      # "w" = write (replaces the file)
    f.write("Line one\n")
    f.write("Line two\n")

with open("notes.txt", "r") as f:      # "r" = read
    for line in f:
        print(line.strip())
```

## Recursion
level: 4
importance: must
summary: A function that calls itself on a smaller problem.

- Every recursive function needs a base case (when to stop) and a recursive case.
- Without a base case it never ends and Python raises RecursionError.
- Trace small inputs by hand first: factorial(3), then factorial(4).

```python
def factorial(n):
    if n <= 1:                     # base case: stop here
        return 1
    return n * factorial(n - 1)    # recursive case: a smaller problem

print(factorial(5))                # 120
```

## Classes and objects
level: 4
importance: must
summary: Bundle data and the actions on that data together.

- A class is a blueprint. An object is one thing built from it.
- __init__ runs when you create an object. self means "this object".
- Functions inside a class are called methods.

```python
class Student:
    def __init__(self, name, grade):   # runs when a Student is created
        self.name = name               # data stored in the object
        self.grade = grade

    def passed(self):                  # a method: an action of the object
        return self.grade >= 75

ana = Student("Ana", 88)               # make an object
print(ana.name, ana.passed())          # Ana True
```

## Inheritance
level: 4
importance: good
summary: Make a new class that reuses and extends another one.

- class Child(Parent) gets everything the parent has.
- Override a method by defining it again in the child.
- super() calls the parent's version.

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

class Dog(Animal):                     # Dog inherits from Animal
    def speak(self):                   # override the parent's method
        return f"{self.name} says Woof!"

print(Dog("Bantay").speak())
print(Animal("Generic").speak())
```

## Stacks and queues
level: 4
importance: good
summary: Two simple ways to store items: last-in-first-out and first-in-first-out.

- Stack (LIFO): the last item in is the first out. Use a list with append() and pop().
- Queue (FIFO): the first item in is the first out. Use deque with popleft().

```python
from collections import deque

stack = []
stack.append("A")
stack.append("B")
print(stack.pop())         # B  (last in, first out)

queue = deque()
queue.append("A")
queue.append("B")
print(queue.popleft())     # A  (first in, first out)
```

## Linked list
level: 4
importance: nice
summary: Items that point to the next item, built with classes.

- Each node stores a value and a link to the next node.
- The last node points to None.
- Follow the links with a while loop.

```python
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None               # no next node yet

first = Node(1)
first.next = Node(2)
first.next.next = Node(3)

current = first
while current is not None:             # follow the links
    print(current.value)
    current = current.next
```

## lambda, map and filter
level: 4
importance: nice
summary: Tiny one-line functions and tools that apply them to lists.

- lambda x: x * 2 is a small unnamed function.
- map(f, items) applies f to every item. filter(f, items) keeps items where f is True.
- Wrap the result in list() to see it.

```python
double = lambda x: x * 2
print(double(4))                                    # 8

numbers = [1, 2, 3, 4, 5, 6]
print(list(map(lambda n: n * n, numbers)))          # [1, 4, 9, 16, 25, 36]
print(list(filter(lambda n: n % 2 == 0, numbers)))  # [2, 4, 6]
```

## Regular expressions
level: 4
importance: nice
summary: Find patterns in text, like phone numbers or emails.

- import re. re.search(pattern, text) finds the first match.
- \d is a digit, \w a letter or digit, + means one or more.
- Raw strings (r"...") keep backslashes safe.

```python
import re

text = "Call 0917-123-4567 now"
match = re.search(r"\d{4}-\d{3}-\d{4}", text)   # 4 digits, 3 digits, 4 digits
if match:
    print("Found:", match.group())
print(re.findall(r"\d+", "a1b22c333"))          # ['1', '22', '333']
```
