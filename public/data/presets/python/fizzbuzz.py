# PRESET: FizzBuzz (a famous practice problem)
# Count from 1 to 20.
#   multiples of 3  -> "Fizz"
#   multiples of 5  -> "Buzz"
#   multiples of both -> "FizzBuzz"

for n in range(1, 21):
    if n % 3 == 0 and n % 5 == 0:          # % gives the remainder; 0 means "divides evenly"
        print("FizzBuzz")
    elif n % 3 == 0:
        print("Fizz")
    elif n % 5 == 0:
        print("Buzz")
    else:
        print(n)
