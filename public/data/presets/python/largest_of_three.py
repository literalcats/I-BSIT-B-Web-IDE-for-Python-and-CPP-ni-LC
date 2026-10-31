# PRESET: Largest of three numbers
# Compare the numbers with if / elif / else.

a = int(input("First number: "))
b = int(input("Second number: "))
c = int(input("Third number: "))

if a >= b and a >= c:                      # a beats both of the others
    largest = a
elif b >= a and b >= c:                    # b beats both of the others
    largest = b
else:                                      # then c must be the largest
    largest = c

print("The largest number is", largest)

# Bonus: Python can do this in one line with max()
print("Using max():", max(a, b, c))
