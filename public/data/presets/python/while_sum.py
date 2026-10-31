# PRESET: Add numbers until 0 (while loop)
# A while loop repeats for as long as its condition is True.
# Type one number per line in the Input tab. End with 0.

total = 0
number = int(input("Enter a number (0 to stop): "))

while number != 0:                         # keep going until the user types 0
    total = total + number                 # add it to the running total
    number = int(input("Enter a number (0 to stop): "))   # ask again

print("The total is", total)
