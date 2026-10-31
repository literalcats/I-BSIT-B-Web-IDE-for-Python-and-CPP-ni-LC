# PRESET: Secret number game
# The computer picks a number from 1 to 10. You have 5 tries to guess it.
# Type one guess per line in the Input tab.

import random                              # gives us random numbers

secret = random.randint(1, 10)             # a random whole number from 1 to 10
tries = 5

for attempt in range(1, tries + 1):
    guess = int(input(f"Guess {attempt} of {tries}: "))

    if guess == secret:
        print("Correct! You win!")
        break                              # leave the loop: the game is over
    elif guess < secret:
        print("Too low.")
    else:
        print("Too high.")
else:
    # this 'else' belongs to the for loop: it runs only if we never used break
    print(f"Out of tries. The number was {secret}.")
