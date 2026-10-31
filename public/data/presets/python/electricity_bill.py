# PRESET: Electricity bill calculator
# The more electricity you use, the higher the price per kWh (tiered rates).
# NOTE: these rates are made up for practice. They are not real.

kwh = float(input("Electricity used (kWh): "))

# --- Rate per kWh in each tier (change these to experiment) ---
RATE_FIRST_100 = 9.50                      # kWh 1 to 100
RATE_NEXT_100 = 11.25                      # kWh 101 to 200
RATE_ABOVE = 13.00                         # kWh above 200

if kwh <= 100:
    total = kwh * RATE_FIRST_100
elif kwh <= 200:
    total = 100 * RATE_FIRST_100 + (kwh - 100) * RATE_NEXT_100
else:
    total = (100 * RATE_FIRST_100
             + 100 * RATE_NEXT_100
             + (kwh - 200) * RATE_ABOVE)

print(f"Usage: {kwh} kWh")
print(f"Total bill: {total:.2f}")          # :.2f shows 2 decimal places
