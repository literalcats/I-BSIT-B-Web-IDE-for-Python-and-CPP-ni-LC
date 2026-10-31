# PRESET: ASCII art - checkerboard
# Idea: add the row number and column number.
# If the sum is even draw "#", otherwise draw ".".

size = 8

for row in range(size):
    line = ""                              # build one row of text
    for col in range(size):
        if (row + col) % 2 == 0:           # even sum -> dark square
            line = line + "# "
        else:                              # odd sum -> light square
            line = line + ". "
    print(line)
