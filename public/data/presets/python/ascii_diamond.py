# PRESET: ASCII art - diamond
# A diamond is a pyramid on top of an upside-down pyramid.

size = int(input("Size of the diamond (try 4): "))

# --- Top half (growing) ---
for row in range(1, size + 1):
    print(" " * (size - row) + "*" * (2 * row - 1))

# --- Bottom half (shrinking) ---
for row in range(size - 1, 0, -1):         # counts DOWN: size-1, ... 2, 1
    print(" " * (size - row) + "*" * (2 * row - 1))
