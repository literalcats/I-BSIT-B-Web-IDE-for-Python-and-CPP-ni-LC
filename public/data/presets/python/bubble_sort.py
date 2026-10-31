# PRESET: Bubble sort
# Sorts a list by swapping neighbours that are out of order.
# Slow for big lists, but it is a great way to learn how sorting works.

numbers = [64, 25, 12, 22, 11]
print("Before:", numbers)

n = len(numbers)
for i in range(n - 1):                     # each pass puts one more number in place
    for j in range(n - 1 - i):             # compare neighbours
        if numbers[j] > numbers[j + 1]:    # out of order?
            # swap them (Python can swap in one line)
            numbers[j], numbers[j + 1] = numbers[j + 1], numbers[j]

print("After: ", numbers)
