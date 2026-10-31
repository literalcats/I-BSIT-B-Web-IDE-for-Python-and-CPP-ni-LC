# PRESET: Variables and data types
# A variable is a name that holds a value.

# --- Create variables (the type is chosen for you) ---
name = "Ana"            # str   : text, always in quotes
age = 17                # int   : whole number
height = 1.62           # float : decimal number
is_student = True       # bool  : True or False

# --- Show them ---
print("Name:", name)
print("Age:", age)
print("Height:", height)
print("Is a student?", is_student)

# --- type() tells you what kind of value it is ---
print(type(name))       # <class 'str'>
print(type(age))        # <class 'int'>

# --- You can change a variable later ---
age = age + 1
print("Next year I will be", age)
