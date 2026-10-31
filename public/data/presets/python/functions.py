# PRESET: Functions
# A function is a named block of code you can use again and again.

# --- 1. A function with no inputs ---
def greet():
    print("Hello from a function!")

# --- 2. A function with inputs (parameters) that RETURNS an answer ---
def area(width, height):
    return width * height                  # return sends the answer back

# --- 3. A function that answers yes/no ---
def is_even(n):
    return n % 2 == 0                      # True when n divides evenly by 2

# --- Using (calling) the functions ---
greet()
print("Area:", area(5, 3))                 # 15
print("Is 10 even?", is_even(10))          # True
print("Is 7 even?", is_even(7))            # False
