# PRESET: ASCII art - a box
# Draws a rectangle with a border and an empty inside.

width = int(input("Width: "))
height = int(input("Height: "))

for row in range(height):
    if row == 0 or row == height - 1:      # the first and last rows are solid
        print("#" * width)
    else:                                  # the middle rows: border, spaces, border
        print("#" + " " * (width - 2) + "#")
