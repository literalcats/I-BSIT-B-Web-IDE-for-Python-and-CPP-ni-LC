# PRESET: Prime number checker
# A prime number can only be divided evenly by 1 and itself (2, 3, 5, 7, 11 ...).

def is_prime(n):
    if n < 2:                              # 0 and 1 are not prime
        return False
    for divisor in range(2, n):            # try every number from 2 up to n - 1
        if n % divisor == 0:               # divides evenly -> NOT prime
            return False
    return True                            # nothing divided it -> prime

number = int(input("Enter a number: "))
if is_prime(number):
    print(number, "is prime")
else:
    print(number, "is not prime")
