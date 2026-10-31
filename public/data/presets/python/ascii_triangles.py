# PRESET: ASCII art - triangles
# Nested loops: the outer loop makes the rows, the inner loop makes the stars.

size = int(input("How many rows? "))

print("Right triangle:")
for row in range(1, size + 1):
    for col in range(row):                 # row 1 -> 1 star, row 2 -> 2 stars ...
        print("*", end="")                 # end="" keeps printing on the same line
    print()                                # start a new line after each row

print()
print("Pyramid:")
for row in range(1, size + 1):
    spaces = " " * (size - row)            # " " * 3 repeats the space 3 times
    stars = "*" * (2 * row - 1)            # 1, 3, 5, 7 ... stars
    print(spaces + stars)
