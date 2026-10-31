# PRESET: Recursion
# Recursion = a function that calls ITSELF on a smaller problem.
# Every recursive function needs a BASE CASE, the place where it stops.

def factorial(n):
    # factorial(4) = 4 * 3 * 2 * 1 = 24
    if n <= 1:                             # base case: stop here
        return 1
    return n * factorial(n - 1)            # recursive case: a smaller problem

def fibonacci(n):
    # 0, 1, 1, 2, 3, 5, 8, 13 ... each number is the sum of the two before it
    if n < 2:                              # base case
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("5! =", factorial(5))                # 120
for i in range(10):
    print("fibonacci", i, "=", fibonacci(i))
