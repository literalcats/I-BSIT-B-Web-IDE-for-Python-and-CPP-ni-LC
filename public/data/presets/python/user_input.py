# PRESET: Asking the user (input)
# input() waits for the user to type something.
# In this app, type your answers in the Input tab, one per line.

name = input("What is your name? ")        # input() always gives TEXT
birth_year = int(input("Year you were born? "))   # int() turns text into a number

# --- Use what the user typed ---
print("Hello,", name + "!")                # + joins pieces of text
print(f"Born in {birth_year}.")            # an f-string puts variables inside text
print(f"In 2030 you will be {2030 - birth_year} years old.")
