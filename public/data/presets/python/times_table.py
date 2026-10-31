# PRESET: Multiplication table (for loop)
# A for loop repeats code. range(1, 11) gives 1, 2, ... 10.

number = int(input("Which times table? "))

for i in range(1, 11):                     # i becomes 1, then 2, ... up to 10
    print(f"{number} x {i} = {number * i}")
