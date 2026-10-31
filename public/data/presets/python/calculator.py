# PRESET: Simple calculator
# Reads two numbers and an operator, then shows the answer.

a = float(input("First number: "))         # float() allows decimals
op = input("Operator (+ - * /): ")
b = float(input("Second number: "))

# --- Choose what to do based on the operator ---
if op == "+":
    print(a + b)
elif op == "-":
    print(a - b)
elif op == "*":
    print(a * b)
elif op == "/":
    if b == 0:                             # never divide by zero!
        print("Error: you cannot divide by zero.")
    else:
        print(a / b)
else:
    print("Unknown operator:", op)
