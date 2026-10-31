# PRESET: Age calculator
# Works out a person's age from their birth year.

from datetime import date                  # a tool that knows today's date

birth_year = int(input("Year you were born: "))
current_year = date.today().year           # this year, taken from the computer's clock

age = current_year - birth_year

# --- Check the answer makes sense ---
if birth_year > current_year:
    print("That year has not happened yet!")
elif age < 18:
    print(f"You are about {age} years old (a minor).")
else:
    print(f"You are about {age} years old (an adult).")
